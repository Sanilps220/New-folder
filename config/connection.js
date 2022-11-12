const mongoClient = require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect = function(done){
    const url='mongodb://localhost:27017'
    const dbname='shopping'
    
    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)     

        done()       
    })      
}     
 
// module.exports.get = function(){
//     return state.db
// }
//second>>>>>>>
// //atlas config 

const state1={
    db:null
}
module.exports.connect1 = (done)=>{
   const uri1 = 
   "mongodb+srv://Shopiy:bVkC0AbgLiuo6O4T@cluster0.wkj9626.mongodb.net/?retryWrites=true&w=majority"
   const dbname='Shopping'
   //'test'


    mongoClient.connect(uri1,{ useNewUrlParser: true,},(err,data)=>{
        if(err) return done(err)
        state1.db=data.db(dbname) 
    //     let data2 = ()=>{
    //         return new Promise(async(resolve,reject)=>{
    //         let da = await state1.db.collection("Admin").find({ "admin":"sanil" }).toArray() 
    //     console.log(da);
    // })
   
    // } 
    //     data2()
        done()
    })
}
 
module.exports.get = function(){
    return state1.db
}
// // module.exports.atlas =async  function(){
// //     const {MongoClient} = require('mongodb');
// // let uri = "mongodb+srv://sanil:9wU2hPsKIrIDg6TJ@cluster0.291only.mongodb.net/?retryWrites=true&w=majority"
// // const client = new MongoClient(uri);

// // try {
// //     // Connect to the MongoDB cluster
// //     await client.connect();

// //     // Make the appropriate DB calls
// //     async function listDatabases(client){
// //         databasesList = await client.db("shopping").collection("user").listDatabases();
     
// //         console.log("Databases:");
// //         databasesList.databases.forEach(db => console.log(` - ${db.name}`));
// //     };

// // } catch (e) {
// //     console.error(e);
// // } finally {
// //     await client.close();
// // }

// // }
// .