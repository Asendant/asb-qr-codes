const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;
const { S3 } = require('aws-sdk');

// Middleware to parse JSON body
app.use(express.json());

// AWS S3 bucket information
const bucketName = 'cyclic-vast-pink-pants-us-west-2';
const key = `${__dirname}/data.json`; // Replace with the desired S3 key

const s3 = new S3();

// Initialize dataObject
let dataObject = JSON.parse(`${__dirname}/data.json`);

// Retrieve data from S3 bucket and initialize dataObject
s3.getObject({ Bucket: bucketName, Key: key }, (err, data) => {
  if (err) {
    console.error('Error reading data from S3:', err);
    // Handle the error as needed
  } else {
    dataObject = JSON.parse(data.Body.toString());
    console.log('Data retrieved from S3');
  }
});

// Create the server
app.get('/', (req, res) => {
  const { studentid } = req.query;

  if (studentid) {
    const student = dataObject.students.find((student) => student.studentid === parseInt(studentid));
    if (student) {
      student.numberofclicks += 1;

      // Update data in S3 bucket
      s3.putObject({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(dataObject),
      }, (err, data) => {
        if (err) {
          console.error('Error updating data in S3:', err);
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