const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;
const { S3 } = require('aws-sdk');
const fs = require('fs');

// Middleware to parse JSON body
app.use(express.json());

// AWS S3 bucket information
const bucketName = 'cyclic-vast-pink-pants-us-west-2';
const key = "./dev-data/data.json"; // Replace with the desired S3 key
const region = 'us-west-2'; // Replace with your desired AWS region

const s3 = new S3({ region });

// Initialize dataObject by reading the local data.json file
let dataObject = readLocalDataFile();

// Function to read the local data.json file
function readLocalDataFile() {
  try {
    const data = fs.readFileSync('./dev-data/data.json', 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local data file:', err.message);
    // Handle the error as needed
    return { students: [] }; // Return an empty object as a default value
  }
}

// Function to write the local data.json file
function writeLocalDataFile(data) {
  fs.writeFileSync('./dev-data/data.json', JSON.stringify(data, null, 2), 'utf-8');
}

// Retrieve data from S3 bucket and initialize dataObject
async function fetchDataFromS3() {
  const params = { Bucket: bucketName, Key: "./dev-data/data.json" };
  try {
    const data = await s3.getObject(params).promise();
    dataObject = JSON.parse(data.Body.toString());
    console.log('Data retrieved from S3');
  } catch (err) {
    console.error(`Error reading data from S3: Key: ${params.Key}`, err.message);
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

      // Also update the local data.json file
      writeLocalDataFile(dataObject);

      return res.redirect('https://coast-union-asb.square.site/');
    }
  }

  return res.redirect('https://coast-union-asb.square.site/');
});

app.get('/data', (req, res) => {
  // Retrieve data from S3 bucket and send it as a response
  fetchDataFromS3()
    .then(() => {
      if (!dataObject) {
        return res.status(500).json({ error: 'Data not available' });
      }
      res.json(dataObject);
    })
    .catch((err) => {
      console.error('Error fetching data from S3:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
