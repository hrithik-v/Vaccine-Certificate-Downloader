const express = require('express')
const app = express()
const crypto = require('crypto')
const bodyParser = require('body-parser')
const ejs = require('ejs')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('views'))

app.set('view engine', 'ejs')


app.route('/').get((req, res) => {
    res.render('index', { redirect: false })
}).post(async (req, res) => {
    try {
        var response = await fetch('https://cdn-api.co-vin.in/api/v2/auth/public/generateOTP', {
            method: 'POST',
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({ mobile: req.body.mobileNo })
        })


        if (response.status === 200) {
            var jsObject = await response.json()
            res.render('enterOTP', jsObject)
        }
        else if (response.status === 400) {
            /* res.write('<script>alert("OTP was already Sent, Try after 3mins")</script>')
            res.end('<a href="/">Go Back</a>') */
            res.render('index', { redirect: true })
        }
        else {
            res.render('handleError', { error: response })
        }
    }
    catch (err) {
        res.redirect('/')
    }
})



app.post('/certificate', async (req, res) => {
    const txnId = req.body.txnId
    const hashedOTP = crypto.createHash('sha256').update(req.body.otp).digest('hex')
    try {

        var response = await fetch('https://cdn-api.co-vin.in/api/v2/auth/public/confirmOTP', {
            method: 'POST',
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                otp: hashedOTP,
                txnId: txnId
            })
        })
        if (response.status === 200) {

            var js = await response.json()
            let options = {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${js.token}`
                }
            };

            var result = await fetch(`https://cdn-api.co-vin.in/api/v2/registration/certificate/public/download?beneficiary_reference_id=${req.body.beneficiary_Id}`, options)

            var content = await result.arrayBuffer()

            res.type('application/pdf')
            res.send(Buffer.from(content))
        }
        else {
            res.render('handleError', { error: response })
        }
    }
    catch (err) {
        res.redirect('/')
    }

})

app.listen(80, () => {
    console.log('Started');
})