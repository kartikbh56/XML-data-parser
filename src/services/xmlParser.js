// src/services/xmlParser.js
const { XMLParser } = require('fast-xml-parser');

/**
 * parseExperianXml
 * Accepts XML string, returns a JS object matching CreditReport model
 */
function parseExperianXml(xmlString) {
  const options = {
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseNodeValue: true,
    parseAttributeValue: true,
    trimValues: true
  };
  const parser = new XMLParser(options);
  const parsed = parser.parse(xmlString);

  // Root element per sample: INProfileResponse
  const root = parsed.INProfileResponse || parsed;

  // header
  const header = root.Header || {};
  const creditHeader = root.CreditProfileHeader || {};
  const currentApp = (root.Current_Application && root.Current_Application.Current_Application_Details) || {};
  const applicant = currentApp.Current_Applicant_Details || {};
  const cais = (root.CAIS_Account && root.CAIS_Account.CAIS_Summary) || {};
  const caisSummary = cais.Credit_Account || {};
  const totalOutstanding = (root.CAIS_Account && root.CAIS_Account.Total_Outstanding_Balance) || {};
  const accountsRaw = [];

  // CAIS_Account_DETAILS may be single object or array
  const caisDetailsParent = root.CAIS_Account && root.CAIS_Account.CAIS_Account_DETAILS;
  let caisDetails = [];
  if (Array.isArray(caisDetailsParent)) caisDetails = caisDetailsParent;
  else if (caisDetailsParent) caisDetails = [caisDetailsParent];

  // map account items (CAIS_Account_DETAILS may also include multiple repeated nodes)
  // But in sample, multiple CAIS_Account_DETAILS nodes exist; fast-xml-parser will parse repeated nodes into array
  // For safety, search for all CAIS_Account_DETAILS under CAIS_Account (top-level)
  const caisAccountNodes = [];
  if (root.CAIS_Account) {
    const raw = root.CAIS_Account;
    // fast-xml-parser will create CAIS_Account_DETAILS entries; they may be array or object
    const find = (obj) => {
      if (!obj) return;
      if (obj.CAIS_Account_DETAILS) {
        if (Array.isArray(obj.CAIS_Account_DETAILS)) {
          obj.CAIS_Account_DETAILS.forEach(n => caisAccountNodes.push(n));
        } else {
          caisAccountNodes.push(obj.CAIS_Account_DETAILS);
        }
      }
    };
    find(raw);
  }

  // dedupe: if empty, try scanning root for repeated CAIS_Account_DETAILS keys (edge cases omitted)
  const accounts = caisAccountNodes.map(a => ({
    subscriberName: a.Subscriber_Name || null,
    accountNumber: a.Account_Number || null,
    portfolioType: a.Portfolio_Type,
    accountType: a.Account_Type,
    openDate: a.Open_Date,
    creditLimitAmount: NumberOrNull(a.Credit_Limit_Amount),
    highestCreditOrLoanAmount: NumberOrNull(a.Highest_Credit_or_Original_Loan_Amount),
    accountStatus: a.Account_Status,
    paymentRating: a.Payment_Rating,
    paymentHistoryProfile: a.Payment_History_Profile,
    currentBalance: NumberOrNull(a.Current_Balance),
    amountPastDue: NumberOrNull(a.Amount_Past_Due),
    dateReported: a.Date_Reported,
    dateClosed: a.Date_Closed,
    dateOfAddition: a.DateOfAddition,
    currencyCode: a.CurrencyCode,
    holder: {
      surname: (a.CAIS_Holder_Details && a.CAIS_Holder_Details.Surname_Non_Normalized) || (a.CAIS_Holder_Details && a.CAIS_Holder_Details.Surname_Non_Normalized) || null,
      firstName: (a.CAIS_Holder_Details && a.CAIS_Holder_Details.First_Name_Non_Normalized) || null,
      incomeTaxPAN: (a.CAIS_Holder_ID_Details && a.CAIS_Holder_ID_Details.Income_TAX_PAN) || null,
      dateOfBirth: (a.CAIS_Holder_Details && a.CAIS_Holder_Details.Date_of_birth) || null
    },
    holderAddress: (a.CAIS_Holder_Address_Details) ? {
      line1: a.CAIS_Holder_Address_Details.First_Line_Of_Address_non_normalized,
      line2: a.CAIS_Holder_Address_Details.Second_Line_Of_Address_non_normalized,
      city: a.CAIS_Holder_Address_Details.City_non_normalized,
      state: a.CAIS_Holder_Address_Details.State_non_normalized,
      zip: a.CAIS_Holder_Address_Details.ZIP_Postal_Code_non_normalized,
      countryCode: a.CAIS_Holder_Address_Details.CountryCode_non_normalized
    } : {}
  }));

  // addresses: try to extract top-level Current_Applicant_Address_Details & CAIS_Holder_Address_Details
  const addresses = [];
  if (currentApp.Current_Applicant_Address_Details) {
    const a = currentApp.Current_Applicant_Address_Details;
    addresses.push({
      line1: a.FlatNoPlotNoHouseNo || a.BldgNoSocietyName || null,
      line2: a.RoadNoNameAreaLocality || null,
      city: a.City || null,
      state: a.State || null,
      zip: a.PINCode || null,
      country: a.Country_Code || null
    });
  }
  // add CAIS holder address if present (first account)
  if (caisAccountNodes.length && caisAccountNodes[0].CAIS_Holder_Address_Details) {
    const b = caisAccountNodes[0].CAIS_Holder_Address_Details;
    addresses.push({
      line1: b.First_Line_Of_Address_non_normalized,
      line2: b.Second_Line_Of_Address_non_normalized,
      city: b.City_non_normalized,
      state: b.State_non_normalized,
      zip: b.ZIP_Postal_Code_non_normalized,
      country: b.CountryCode_non_normalized
    });
  }

  const result = {
    reportNumber: creditHeader.ReportNumber || header.ReportNumber || null,
    reportDate: creditHeader.ReportDate || header.ReportDate || null,
    reportTime: creditHeader.ReportTime || header.ReportTime || null,
    name: {
      firstName: (applicant.First_Name) || applicant.First_Name || (currentApp.Current_Applicant_Details && currentApp.Current_Applicant_Details.First_Name) || null,
      lastName: (applicant.Last_Name) || applicant.Last_Name || null,
      middleNames: []
    },
    mobilePhone: applicant.MobilePhoneNumber || applicant.Telephone_Number_Applicant_1st || ( (caisAccountNodes[0] && caisAccountNodes[0].CAIS_Holder_Phone_Details && caisAccountNodes[0].CAIS_Holder_Phone_Details.Telephone_Number) ) || null,
    PAN: ( (caisAccountNodes[0] && caisAccountNodes[0].CAIS_Holder_ID_Details && caisAccountNodes[0].CAIS_Holder_ID_Details.Income_TAX_PAN) || applicant.IncomeTaxPan || null),
    creditScore: root.SCORE && root.SCORE.BureauScore ? Number(root.SCORE.BureauScore) : null,
    scoreConfidence: root.SCORE && root.SCORE.BureauScoreConfidLevel ? root.SCORE.BureauScoreConfidLevel : null,
    reportSummary: {
      totalAccounts: caisSummary.CreditAccountTotal ? Number(caisSummary.CreditAccountTotal) : NumberOrNull(cais.Account && cais.Account.CreditAccountTotal) || null,
      activeAccounts: caisSummary.CreditAccountActive ? Number(caisSummary.CreditAccountActive) : null,
      closedAccounts: caisSummary.CreditAccountClosed ? Number(caisSummary.CreditAccountClosed) : null,
      defaultAccounts: caisSummary.CreditAccountDefault ? Number(caisSummary.CreditAccountDefault) : null,
      currentBalanceAmount: totalOutstanding && totalOutstanding.Outstanding_Balance_All ? Number(totalOutstanding.Outstanding_Balance_All) : null,
      securedAmount: totalOutstanding && totalOutstanding.Outstanding_Balance_Secured ? Number(totalOutstanding.Outstanding_Balance_Secured) : null,
      unsecuredAmount: totalOutstanding && totalOutstanding.Outstanding_Balance_UnSecured ? Number(totalOutstanding.Outstanding_Balance_UnSecured) : null,
      last7DaysEnquiries: (root.TotalCAPS_Summary && Number(root.TotalCAPS_Summary.TotalCAPSLast7Days)) || (root.TotalCAPS_Summary && root.TotalCAPS_Summary.TotalCAPSLast7Days) || (root.TotalCAPSLast7Days) || (root.CAPS && root.CAPS.CAPS_Summary && root.CAPS.CAPS_Summary.CAPSLast7Days) || 0
    },
    capsSummary: {
      last7: Number((root.TotalCAPS_Summary && root.TotalCAPS_Summary.TotalCAPSLast7Days) || 0),
      last30: Number((root.TotalCAPS_Summary && root.TotalCAPS_Summary.TotalCAPSLast30Days) || 0),
      last90: Number((root.TotalCAPS_Summary && root.TotalCAPS_Summary.TotalCAPSLast90Days) || 0),
      last180: Number((root.TotalCAPS_Summary && root.TotalCAPS_Summary.TotalCAPSLast180Days) || 0)
    },
    accounts: accounts,
    addresses: addresses
  };

  return result;
}

function NumberOrNull(val) {
  if (val === undefined || val === null || val === '') return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

module.exports = { parseExperianXml };
