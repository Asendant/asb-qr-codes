const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;
const { S3 } = require('aws-sdk');
const fs = require('fs');

// Middleware to parse JSON body
app.use(express.json());

// AWS S3 bucket information
const bucketName = 'cyclic-vast-pink-pants-us-west-2';
const key = `${__dirname}/dev-data/data.json`; // Replace with the desired S3 key
const region = 'us-west-2'; // Replace with your desired AWS region

const s3 = new S3({ region });

// Initialize dataObject
let dataObject;

// Retrieve data from S3 bucket and initialize dataObject
async function fetchDataFromS3() {
  try {
    const params = { Bucket: bucketName, Key: key };
    const data = await s3.getObject(params).promise();
    dataObject = JSON.parse(data.Body.toString());
    console.log('Data retrieved from S3');
  } catch (err) {
    console.error('Error reading data from S3:', err.message);
    // Handle the error as needed
  }
}

// Initialize dataObject on server startup
fetchDataFromS3();

// Create the server
app.get('/', (req, res) => {
  const { studentid } = req.query;

  if (studentid) {
    const student = dataObject?.students.find((student) => student.studentid === parseInt(studentid));
    if (student) {
      student.numberofclicks += 1;

      // Update data in S3 bucket
      s3.putObject({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(dataObject),
      }, (err, data) => {
        if (err) {
          console.error('Error updating data in S3:', err.message);
          // Handle the error as needed
        } else {
          console.log('Data updated in S3');
        }
      });

      return res.redirect('https://coast-union-asb.square.site/');
    }
  }

  return res.redirect('https://coast-union-asb.square.site/');
});

app.get('/data', (req, res) => {
  if (!dataObject) {
    return res.status(500).json({ error: 'Data not available' });
  }

  res.json(dataObject);
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});