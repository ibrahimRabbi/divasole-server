const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000
const verifiedEmail = require('./email')

app.use(express.json())
app.use(cors())


const userName = process.env.MONGO_USER
const password = process.env.MONGP_PASS
const uri = `mongodb+srv://${userName}:${password}@cluster0.oqkryfl.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const dataCollaction = client.db('divaSoleEmporiun').collection('data')
const cartCollaction = client.db('divaSoleEmporiun').collection('cart')
const userCollaction = client.db('divaSoleEmporiun').collection('user')
const orderCollaction = client.db('divaSoleEmporiun').collection('orders')




async function run() {
    try {
        //await client.connect();

        app.get('/', (req, res) => {
            res.send('welcome to devasole server')
        })


        app.post('/verification', async (req, res) => {
            const data = req.body

            const emailObject = {
                from: {
                    name: 'Divasole',
                    address: 'divasole.emporium@gmail.com'
                },
                to: data?.email,
                subject: `Verified your Email ✔`,
                text: '',
                html: `<p style={margin='5px 2px'}>your otp code</p> 
                       <h2>${data?.otp}</h2>`,
            }


            try {
                const respon = await verifiedEmail(emailObject)
                res.send(respon)
            } catch (error) {
                res.send(error)
            }

        })


        app.get('/data/:categoryName', async (req, res) => {
            let sort = { _id: -1 }
            const categoryName = req.params?.categoryName.toLowerCase()

            if (req.query.sort === 'Low price') {
                sort = { price: -1 }
            }
            if (req.query.sort === 'High price') {
                sort = { price: 1 }
            }

            if (req.query.sort === 'Rating') {
                query = { rating: 5 }
            }

            const findingByCategroy = dataCollaction.find({ category: categoryName }).sort(sort)
            const contArry = await findingByCategroy.toArray()
            res.send(contArry)
        })


        app.get('/alldata', async (req, res) => {
            let query = {}
            let sort = { _id: -1 }

            //search api condition
            if (req.query.search) {
                query = { name: { $regex: req.query.search, $options: 'i' } }
            }

            //sort api conditon
            if (req.query.sort === 'Low price') {
                sort = { price: -1 }
            }
            if (req.query.sort === 'High price') {
                sort = { price: 1 }
            }

            if (req.query.sort === 'Rating') {
                query = { rating: 5 }
            }

            //trendy product find by rating value condition
            if (req.query.rating) {
                query = { rating: parseFloat(req.query.rating) }
                const alldata = await dataCollaction.find(query).sort(sort).limit(20).toArray()
                res.send(alldata)
            } else {
                const alldata = await dataCollaction.find(query).sort(sort).toArray()
                res.send(alldata)
            }

        })

        app.delete('/data/:id', async (req, res) => {
            const id = { _id: new ObjectId(req.params.id) }
            const delet = await dataCollaction.deleteOne(id)
            res.send(delet)
        })



        app.post('/insertData', async (req, res) => {
            const data = req.body
            const inserted = await dataCollaction.insertOne(data)
            res.send(inserted)
        })

        app.get('/getDataById/:id', async (req, res) => {
            const id = { _id: new ObjectId(req.params?.id) }
            const finding = await dataCollaction.findOne(id)
            res.send(finding)
        })

        app.post('/cart', async (req, res) => {
            const data = req.body
            const addToCart = await cartCollaction.insertOne(data)      
            res.send(addToCart)
        })

        app.get('/cart', async (req, res) => {
            const email = { userMail: req.query.email }
            const findByEmail = await cartCollaction.find(email).toArray()
            res.send(findByEmail)
        })

        app.delete('/deleteCartData/:id', async (req, res) => {
            const id = { _id: new ObjectId(req.params.id) }
            const deleting = await cartCollaction.deleteOne(id)
            res.send(deleting)
        })

        app.post('/user', async (req, res) => {
            const inserted = await userCollaction.insertOne(req.body)
            res.send(inserted)
        })

        app.get('/user', async (req, res) => {
            const email = { email: req.query.email }
            const inserted = await userCollaction.findOne(email)
            res.send(inserted)
        })


        app.post('/order', async (req, res) => {
            const inserting = await orderCollaction.insertOne(req.body)
            await cartCollaction.deleteMany({ userMail: req.body.email })
            if (inserting.insertedId) {
                res.send(inserting)
                const emailObject = {
                    from: {
                        name: 'Divasole',
                        address: 'divasole.emporium@gmail.com'
                    },
                    to: req.body?.email,
                    subject: `Congratulation ${req.body.name}✔`,
                    text: '',
                    html: `<div>
                    <p>your order has been proced successfully. we will knock you within 2 hours and maximum 3 hours</p>
                    <br>
                    <br>
                    <br>
                    <br>
                    <br>
                    <strong>Best regards</strong>
                    <strong>DivaSole Emporium</strong>
                    </div>`,
                }
                await verifiedEmail(emailObject)
            }
           
        })

        app.get('/order', async (req, res) => {
            const finding = await orderCollaction.find().sort({ _id: -1 }).toArray()
            res.send(finding)
        })

        app.get('/order/:id', async (req, res) => {
            const query = { _id: new ObjectId(req.params?.id)}
            const data = await orderCollaction.findOne(query)
            res.send(data)
        })

        app.put('/order/:id', async (req, res) => {
            const id = { _id: new ObjectId(req.params.id) }
            const options = { upsert: true };
            const update = {
                $set: {
                    status : req.body.status
                }
            }
            const updateOrder = await orderCollaction.updateOne(id,update,options)
            res.send(updateOrder)
        })



/*******************************************admin panal apis*******************************************/


        app.put('/update/:id', async (req, res) => {
            const id = req.params.id
            const dataobj = req.body
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateData = {
                $set: {
                    name: dataobj.name,
                    price: dataobj.price,
                    image: dataobj.image,
                    category: dataobj.category,
                    available: dataobj.available,
                    description: dataobj.description,
                },
            };
            const result = await dataCollaction.updateOne(filter, updateData, options);
            res.send(result)
        })











    } finally {

    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log('server is running')
})