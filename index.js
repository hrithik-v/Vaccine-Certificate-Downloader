const express = require("express");
const app = express();
const fetch = require("node-fetch");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const ejs = require("ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("views"));

app.set("view engine", "ejs");

// get '/' used for rendering Main Page
// post '/' used for initiating OTP to user
app
  .route("/")
  .get((req, res) => {
    res.render("index", { redirect: false });
  })
  .post(async (req, res) => {
    try {
      var response = await fetch(
        "https://cdn-api.co-vin.in/api/v2/auth/public/generateOTP",
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({ mobile: req.body.mobileNo }),
        }
      );
      // console.log(response);

      if (response.status === 200) {
        var jsObject = await response.json();
        res.render("enterOTP", jsObject);
      } else if (response.status === 400) {
        res.setes;
        res.status(400).render("index", { redirect: true });
      } else {
        res.status(response.status).render("handleError", { error: response });
      }
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  });

// post '/certificate' used to accept OTP and txnId and to send back certificate in pdf format

app.post("/certificate", async (req, res) => {
  const txnId = req.body.txnId;

  // hashing of OTP as required as per schema
  const hashedOTP = crypto
    .createHash("sha256")
    .update(req.body.otp)
    .digest("hex");
  try {
    var response = await fetch(
      "https://cdn-api.co-vin.in/api/v2/auth/public/confirmOTP",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          otp: hashedOTP,
          txnId: txnId,
        }),
      }
    );

    if (response.status === 200) {
      //  if token generated successfully(user authenticated)

      var js = await response.json();
      let options = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${js.token}`, //  Token received in response after confirming OTP
        },
      };

      //  sending token to fetch certificate
      var result = await fetch(
        `https://cdn-api.co-vin.in/api/v2/registration/certificate/public/download?beneficiary_reference_id=${req.body.beneficiary_Id}`,
        options
      );

      var content = await result.arrayBuffer(); //  accepting binary content in arrayBuffer form

      res.type("application/pdf"); //  setting 'content-type' header
      res.send(Buffer.from(content)); // sending pdf content to browser
    } else {
      res.status(response.status).render("handleError", { error: response });
    }
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

app.get("/test", (req, res) => {
  fetch("https://expressjs.com/").then((resp) => {
    console.log(resp.status);
  });
  res.send("Test completed");
});

app.listen(5001 || process.env.PORT);
