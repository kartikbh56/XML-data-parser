// src/models/CreditReport.js
const mongoose = require('mongoose');

const CreditAccountSchema = new mongoose.Schema({
  subscriberName: String,
  accountNumber: String,
  portfolioType: String,
  accountType: String,
  openDate: String,
  creditLimitAmount: Number,
  highestCreditOrLoanAmount: Number,
  accountStatus: String,
  paymentRating: String,
  paymentHistoryProfile: String,
  currentBalance: { type: Number, default: 0 },
  amountPastDue: { type: Number, default: 0 },
  dateReported: String,
  dateClosed: String,
  dateOfAddition: String,
  currencyCode: String,
  // additional holder details
  holder: {
    surname: String,
    firstName: String,
    incomeTaxPAN: String,
    dateOfBirth: String
  },
  holderAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    zip: String,
    countryCode: String
  }
}, { _id: false });

const CreditReportSchema = new mongoose.Schema({
  rawFileName: String,
  rawXml: String, // optional for auditing, can be omitted in prod
  reportNumber: String,
  reportDate: String,
  reportTime: String,
  name: {
    firstName: String,
    lastName: String,
    middleNames: [String]
  },
  mobilePhone: String,
  PAN: String,
  creditScore: Number,
  scoreConfidence: String,
  reportSummary: {
    totalAccounts: Number,
    activeAccounts: Number,
    closedAccounts: Number,
    defaultAccounts: Number,
    currentBalanceAmount: Number,
    securedAmount: Number,
    unsecuredAmount: Number,
    last7DaysEnquiries: Number
  },
  capsSummary: {
    last7: Number,
    last30: Number,
    last90: Number,
    last180: Number
  },
  accounts: [CreditAccountSchema],
  addresses: [{
    line1: String,
    line2: String,
    line3: String,
    city: String,
    state: String,
    zip: String,
    country: String
  }],
  createdAt: { type: Date, default: Date.now }
});

CreditReportSchema.index({ "PAN": 1 });
CreditReportSchema.index({ "reportNumber": 1 });

module.exports = mongoose.model('CreditReport', CreditReportSchema);
