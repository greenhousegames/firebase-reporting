# firebase-reporting
Client-side only solution to reporting in Firebase

## Overview
Firebase Reporting provides the ability to generate reports on data stored in firebase without needing an alternate reporting database or server!  Firebase reporting does all metric calculations on the client using transactions in firebase, ensuring the metrics are reliably calculated regardless of the number of clients attempting to updated the reports.

Firebase reporting is designed to provide simple metrics on the data.  For complex reporting, it is suggested to use an alternate database for better performance.
