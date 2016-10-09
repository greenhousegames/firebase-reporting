# Firebase Reporting
The client-side only solution to reporting with [Firebase](https://firebase.google.com)

[![Build Status](https://travis-ci.org/soumak77/firebase-reporting.svg)](https://travis-ci.org/soumak77/firebase-reporting)
[![npm version](https://badge.fury.io/js/firebase-reporting.svg)](https://badge.fury.io/js/firebase-reporting)

## Overview
Firebase Reporting provides the ability to generate reports on data stored in firebase without needing an alternate reporting database or server!  Firebase reporting does all metric calculations on the client using transactions in firebase, ensuring the metrics are reliably calculated regardless of the number of clients attempting to updated the reports.

Firebase reporting is designed to provide simple metrics on the data.  For complex reporting, it is suggested to use an alternate database for better performance.

## Templates
Use the following templates to get started quickly with Firebase Reporting:
- [JQuery Template](https://github.com/soumak77/firebase-reporting-jquery)
- [Angular Template](https://github.com/soumak77/firebase-reporting-angular)
