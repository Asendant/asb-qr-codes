const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// Middleware to parse JSON body
app.use(express.json());

// AWS S3 bucket information
const bucketName = 'cyclic-real-gold-coral-hem-us-west-2';
const key = './dev-data/data.json'; // Replace with the desired S3 key

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
  // Retrieve data from S3 bucket
  s3.getObject({ Bucket: bucketName, Key: key }, (err, data) => {
    if (err) {
      console.error('Error reading data from S3:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const dataObject = JSON.parse(data.Body.toString());
    res.json(dataObject);
  });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});