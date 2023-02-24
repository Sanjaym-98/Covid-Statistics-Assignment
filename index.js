const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector');
const { data } = require('./data');


app.post("/post", async(req,res)=>{
    const value = await connection.insertMany(data);
    res.status(201).json({
        status:"success",
        value
    })
})

app.get("/totalRecovered", async(req,res)=>{
   try{
  const totalrecovered= await connection.aggregate([
        {
          $group: {
            _id: "total",
            recovered: { $sum: "$recovered" }
          }
        }
      ])
res.status(201).json({
  status:"success",
  totalrecovered
})
   }catch(e){
    res.status(500).json({
        status:"Failed",
        message:e.message
    })
   }
})


app.get("/totalActive", async (req, res) => {
  try {
    const infected = await connection.aggregate([
      {
        $group: {
          _id: "total",
          infected: { $sum: "$infected" }
        }
      }
    ])

    const recovered = await connection.aggregate([
      {
        $group: {
          _id: "total",
          recovered: { $sum: "$recovered" }
        }
      }
    ])
    const Total = infected[0].infected - recovered[0].recovered;

    const totalActive = await connection.aggregate([
      {
        $group: {
          _id: "total"
        }
      }
    ])
    res.status(201).json({
      status: "success",
      active:Total
    })}
    catch(e){
      res.status(500).json({
          status:"Failed",
          message:e.message
      })
     }
  })


  app.get("/totalDeath", async(req,res)=>{
    try{
   const totalDeath= await connection.aggregate([
         {
           $group: {
             _id: "total",
             death: { $sum: "$death" }
           }
         }
       ])
 res.status(201).json({
   status:"success",
   totalDeath
 })
    }catch(e){
     res.status(500).json({
         status:"Failed",
         message:e.message
     })
    }
 })


 app.get('/hotspotStates', async (req, res) => {
 let result;
  try {
   result = await connection.aggregate([
     {$project:{_id:0,"state":"$state",
     "rate":{$round:[{$divide:[{$subtract:["$infected","$recovered"]},"$infected"]},5]}}}
    
     
    ]) 
  
    const finalresult =result.filter((data)=>{
        return data.rate>0.1
    });
   
    res.status(200).json({
      data: finalresult
    })
  } catch (e) {
    res.status(500).json({
      status: 'Failed',
      message: e.message
    })
  }
})



app.get('/healthyStates', async (req, res) => {
  let result
  try {
     result = await connection.aggregate([
     {$project:{_id:0,"state":"$state",
     "mortality":{$round:[{$divide:["$death","$infected"]},5]}}}
    
     
    ]) 
const finalresult = result.filter((data)=>{
  return data.mortality<0.005
})
    res.status(200).json({
      data: finalresult
    })
  } catch (e) {
    res.status(500).json({
      status: 'Failed',
      message: e.message
    })
  }
})
 




app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;