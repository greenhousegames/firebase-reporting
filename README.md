# Firebase Reporting
The client-side only solution to reporting with [Firebase](https://firebase.google.com)

[![Build Status](https://travis-ci.org/greenhousegames/firebase-reporting.svg)](https://travis-ci.org/greenhousegames/firebase-reporting)
[![npm version](https://badge.fury.io/js/firebase-reporting.svg)](https://badge.fury.io/js/firebase-reporting)

## Overview
Firebase Reporting provides the ability to generate reports on data stored in firebase without needing an alternate reporting database or server!  Firebase reporting does all metric calculations on the client using transactions in firebase, ensuring the metrics are reliably calculated regardless of the number of clients attempting to updated the reports.

Firebase reporting is designed to provide simple metrics on the data.  For complex reporting, it is suggested to use an alternate database for better performance.

## Setup
### Templates
Use one of the following templates to get started quickly with Firebase Reporting:
- [JQuery Template](https://github.com/greenhousegames/firebase-reporting-jquery)
- [Angular Template](https://github.com/greenhousegames/firebase-reporting-angular)

### Manual
Add Firebase Reporting to an existing project using npm:

```bash
npm install firebase-reporting --save
```

## Integration
Firebase Reporting can be included in a project using the following code:
```javascript
var FirebaseReporting = require('@greenhousegames/firebase-reporting');
var reporting = new FirebaseReporting(config);
```

The FirebaseReporting constructor takes the following configuration object:
```
{
  firebase: 'object', // reference in firebase for where to store results
  separator: 'string' // string used as separator in firebase database keys (defaults to '~~')
}
```

## API
...
