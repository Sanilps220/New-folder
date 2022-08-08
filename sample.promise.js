const Proise = require('promise')

function grtName(){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            resolve("NIKE")
        },3000)
    })
}

function getMobile(){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            resolve("9057891000")
        },2000)
    })
}

// Promise.all([grtName(),getMobile()]).then((resolve)=>{
//     console.log(resolve);
// })

async function getUser(){
    let name =await grtName();
    console.log(name);
    let mobile = await getMobile();
    console.log(mobile);
}
getUser()