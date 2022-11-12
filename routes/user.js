const { response } = require('express');
var express = require('express');
const session = require('express-session');
const { LoggerLevel } = require('mongodb');
var router = express.Router();
var productHelpers = require('../Helpers/product-helpers');
const userHelpers = require('../Helpers/user-helpers');
const userController = require('../Controller/user-controller')
var paypal = require('paypal-rest-sdk');
const { route } = require('./admin');
var bcrypt = require('bcrypt')
require("dotenv").config()
var fs = require('fs')

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.client_id,
  client_secret: process.env.client_secret,
});

var sid = process.env.sid
var auth_token = process.env.auth_token
var serviceSid = process.env.serviceSid
console.log('service Sid',serviceSid)
const twilio = require("twilio")(sid, auth_token);
/* middelware function */
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next(); 
  } else {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function (req, res, next) {
  var user = req.session.user
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  let men = await productHelpers.getCat("Men")
  let women = await productHelpers.getCat("Women")
  offerProducs = await productHelpers.getOfferProducts()
  console.log(offerProducs);
  let cwProducts = await productHelpers.cwProducts()
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { user,cwProducts, products, cartCount, offerProducs , men ,women ,sub:true});
  });
});

router.get('/cat',(req,res)=>{
  productHelpers.getCat().then((cat)=>{
    res.json({cat})
  })
})

router.get('/load',(req,res)=>{
  res.render('user/goal',{user:true})
})

router.post('/searchPro',(req,res)=>{
  let payload = req.body.payload;
  console.log('paylad',payload);
   productHelpers.getSearch(payload).then((cat)=>{
    res.json({payload:cat})
  })
})


router.get('/searchDatas',(req,res)=>{

  let payload = req.query.search;
  console.log('paylad',req.query);
   productHelpers.getDatas(payload).then((cat)=>{
    res.json({payload:cat})
  })
}) 


/*  login page. */
router.get('/login', (req, res ) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.loggedInErr });
    req.session.loggedInErr = null
  }
});

router.get('/local/:id',async(req, res ) => {  
  console.log(req.params.id);
  const mens = req.params.id;
  let products = [];
  if(mens){
      if(mens =="women"){
        let product = await productHelpers.getProWomens()
        products = product;
      }else{
    let product = await productHelpers.getProMens()
    products = product;
      }
  }
  else{
    let product = await productHelpers.getList(req.params.id)
    products = product
  }
  let men = await productHelpers.getCat("Men")
  let women = await productHelpers.getCat("Women")
  
  res.render('user/view-pro-by-cat',{user:req.session.user,products,men,women,sub:true}) 
})

router.get('/localSer/:id',async(req, res ) => {  
  console.log(req.params.id);
  let men = await productHelpers.getCat("Men")
  let women = await productHelpers.getCat("Women")
  let products = await productHelpers.getSer(req.params.id)
  res.render('user/view-pro-by-cat',{user:req.session.user,products,men,women,sub:true}) 
})

router.get('/lo',  (req, res ) => {  
  productHelpers.getAllProducts().then((newArrivels) => {
  res.render('user/index',{newArrivels,user:{id:'62e67b447f15ef388b5a8df8'} })
  })
})

router.post('/profPic/',(req,res)=>{
  console.log(req.query.id); 
  console.log('files',req.files);
  let image = req.files?.image;
  let ID = req.session.user._id
  console.log("post method", req.files.image);
  fs.unlink(`./public/product-images/profile-pic/${ID}.jpg`,
  (err,data)=>{    
    image.mv('./public/product-images/profile-pic/62e67b447f15ef388b5a8df8.jpg')
    if(err) console.log(err);   
    console.log('pend',data) 
    res.send({staus:true}) 
 
  }
  )

})

 
router.post('/phone-verify',(req,res,next)=>{
  
  var phone = req.body.phone
  console.log("phone",process.env.serviceSID);
  req.session.mob = phone; //mobile otp login number storing in session
  phone = phone.toString()

   userHelpers.phoneCheck(phone).then((response)=>{
       if(response.userExist){ 
            twilio.verify.v2.services(process.env.serviceSID)
            .verifications
            .create({  to:`+91${req.body.phone}`,    channel:"sms"  })
      .then((verifications)=>{
        console.log(verifications.status);
        OtpPhone=phone;        
        res.render('user/otp-verify',{OtpPhone}) 
      }).catch(err => {throw err})
      }else{ 
      console.log("lopins");
      req.session.loggedInErr = "Invalid Phone Number";
      res.redirect("/login")
    }
  }); //data base  
  OtpPhone = null; // change to default
});



router.get("/otp-verify",async(req,res)=>{
  let phoneNumber = req.query.phonenumber;
  let otpNumber = req.query.otpnumber;
  console.log(otpNumber)
  twilio.verify
    .services(serviceSid)
    .verificationChecks.create({
      to:`+91${phoneNumber}`,
      code:otpNumber
    })
    .then((resp)=>{
      console.log("OTP success :",resp);
      if(resp.valid){
        userHelpers.phoneCheck(phoneNumber).then((response)=>{
          req.session.user = response.user;
          req.session.loggedIn = true;
          let valid =true;
          req.session.mob = null;  
          res.send(valid);
        });
      }else{
        let valid = false;
        res.send(valid);
      }
    })
});

// ===================login & sessin=================
router.post('/login', (req, res) => {
  console.log(req.body)
  if(req.body.Email && req.body.Pass){
  userHelpers.doLogin(req.body).then((response) => {
    console.log(response);
    if (response.status) { 
      if (response.user.userBlocked){
      req.session.loggedInErr ="User is Blocked";
      console.log("...............blocked user.....");
      res.redirect('/login');
    }else{
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    }
  }
  
    else {
      req.session.loggedInErr = "Please check your entries and try again."
      res.redirect('/login')
    }
  })
} else{
    req.session.loggedInErr = "Required all fields."
    res.redirect('/login') }
})
/*  signup page. */
let referel;
router.get('/signup', (req, res) => {  
  let referel =  req.query.referel;  
  if (!req.session?.loggedIn) {
    if(req.session.mesg){
    let msg = req.session.mesg
    res.render('user/signup', {msg}) 
    req.session.mesg = false
    }else{
      console.log('fun');
      res.render('user/signup',{header:'Shopiy'})
    }   
  } else { res.redirect('/') }  
    
})    
//===== =============================== signup ==============================
router.post('/signup',async(req, res) => {   
  console.log(req.body);
  let val = req.body ;
  if(val.Uname == '' || val.Email === '@gmail.com' || val.phone == '' || val.Pass == ''){
    req.session.mesg = 'Please fill all fields'
    res.redirect('/signup')
  } 
  else{ 
  var details = await userHelpers.checkSignUp(req.body.Uname, req.body.Email)  
  if(details == ""|| details == null ){
  userHelpers.doSighnup(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = response     
    refereUser=req.body._id
    twilio.verify.services(serviceSid)
    .verifications.create({
      to: `+91${req.body.phone}`,
      channel: "sms",
    }).then((ress) => {      
      let signupPhone = req.body.phone;
      res.render("user/signupOtp", { signupPhone, refereUser });
      }).catch((err) => {         
      res.redirect('/')  
      })
    })
  }else{
    res.render("user/signup",{message:'User Already Exist'})
  }
}
}) 
 

router.get('/signupOtp',async(req,res)=>{
  phoneNumber = req.query.phoneNumber
  otpNumber = req.query.otpnumber
  
  twilio.verify.services(process.env.serviceSID)
    .verificationChecks.create({
      to: "+91" + phoneNumber,
      code: otpNumber,
    })
    .then((res)=>console.log('message has sent!')     
 
    )
  res.json({user:true})
})
/* logout */
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
});
/* cart page */
router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)

  if (products.length === 0) {
    res.render('user/cart', { totalValue: 00, cartErr: true })
  } else {
    let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
    console.log(totalValue);
    res.render('user/cart', { products, user: req.session.user._id, totalValue })
  }
})

router.get('/wishlist/:id',verifyLogin,(req,res)=>{
  console.log("Uesr :"+ req.session.user);
    productHelpers.addtoWishlist(
      req.params.id,
      req.session.user._id
    ).then(()=>{console.log("Wish list +1");
      res.send({wish:true})
  })
})

router.get('/wishlist',verifyLogin,async(req,res)=>{
  let wishList = await productHelpers.getWishlist(req.session.user._id)
    res.render("user/wishList",{user:req.session.user,wishList})
})
router.post('/wishlist',(req,res)=>{
  productHelpers.removeWish(req.body.proId,req.body.user).then((resp)=>{
    res.send(200)
  })
})

/* cart */
router.get('/add-to-cart/:id',verifyLogin,   (req, res) => {
  console.log("api ===== api ==== api");
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    console.log("api call-------------------------------");
    res.json({ status: true,user:req.session.user })
  }) 
})

router.post('/change-product-quantity',async(req, res, next) => {
  let quantity = await userHelpers.findQuantity(req.body)
  let itemq = quantity.quantity
  let cart = req.body.quantity
  if(cart <= itemq || req.body.count == -1 ){
  userHelpers.changeProductQantity(req.body).then(async (response) => {
    console.log(req.body.quantity);
    if (req.body.count == -1 && req.body.quantity == 1) {
      console.log(req.body.quantity);
    } else {
      response.total = await userHelpers.getTotalAmount(req.body.user)
    }
  
    res.json(response) /* resopnse data convert to json then send to response */
  }) 
}else{
  res.json({err:true,status:'Out of stock'})
}
})

router.get('/place-order',verifyLogin, async function (req, res) {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  
  res.render('user/place-order', { total, user: req.session.user })
  console.log(req.session.user);
})    
 
router.post('/place-order', async (req, res) => {
  console.log('lol :',req.query);
  code = req.query.code;
  address = req.body.address;
  console.log('lol :',req.query.code);
  pay = req.body['payment-method'] 
  if(address == "" || address == undefined || pay == undefined ){
    res.json({addressErr:true})
  }else{
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  if(code){
    
    amount =  await userHelpers.getCop(code,req.session.user._id)
    console.log(amount);
    if(amount.value !== null){    totalPrice = totalPrice - amount.value.offer;}
     
  }
  console.log('after add cps',totalPrice);
 
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    console.log(orderId); 
    if(req.body.CouponCode){
      req.session.total 
    }
    if (req.body['payment-method'] === 'COD') {
      res.json({ CODSuccess: true })
    } 
    else if (req.body['payment-method'] === 'Razorpay'){  
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        console.log("resonse" + response.amount)
        res.json(response)
      })
    } 
    else {  
    //  let dollars =  
    //  dollars.toFixed(2) 
     // userHelpers.placeOrder(userId, req.body , products ,req.session.total)
     console.log("payapal :");
     var create_payment_json ={
      intent: "sale", 
      payer:{
        payment_method: "paypal",
      },
      redirect_urls:{
      return_url:'http://localhost:3000/form-success',
      cancel_url:"http://localhost:3000/",
     },
     transactions:[
      {
        item_list: {
          items: [
            {
              name: "item",
              sku: "item",
              price: "1.00",
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: "1.00",
        },
        description: "This is the payment description.",
      },
    ]
  };
    paypal.payment.create(create_payment_json, function(error, payment){
      if(error) {
        throw error;
      }else{
        console.log("Create Payment Response");
        console.log(payment);
        console.log(payment.transactions[0].amount);
        for(var i = 0; i < payment.links.length; i++){
          if (payment.links[i].rel === "approval_url") {
            let link = payment.links[i].href;
            link = link.toString();
            res.json({ paypal: true, url: link });
          }
        }
      }
    });
  }
  })
} 
});

router.get("/successful", (req, res) => {
  console.log("------------success paypal : ",req.session.user._id)
  req.query.PayerID;
  req.query.paymentId;

  const excute_payments_json ={
    payer_id:paymentId,
    transactions:[{
      amount:{
        currency:"USD",
        total:"10.0",
      },
  }, ],
  };
  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error , payment){
      if(error) {throw err;}
      else{
        console.log(JSON.stringify(payment));
        res.render("user/form-success")
      }
    }
  )
})

router.get('/form-success',verifyLogin, (req, res) => {
  userHelpers.orderSuccess(req.session.user._id)
  console.log("payment completed");
  res.render('user/form-success')
})


router.get('/orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { user: req.session.user, orders })
})

router.post('/cancelOrder',async(req,res)=>{      
    let orders = await userHelpers.cancelOrder(req.body.orderId)
    res.json({status:true});
})
 
router.get('/view-order-products/:id',verifyLogin, async (req, res) => {
  let proId = req.params.id;
  console.log("product Id : "+proId);
  let id = req.session.user._id;
  let user = req.session.user;
  let details = await productHelpers.getOrderProducts(proId)
  res.render('user/sample', { user,details })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("Payment successfull");
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log("Payment failed from Server");
    res.json({ status: 'Pament failed' })
  })
})

router.get('/proView/:id',verifyLogin,(req,res)=>{
  userHelpers.deailedView(req.params.id).then((result)=>{
    console.log(result);
    let user =  req.session.user
    res.render('user/proView',({product:result,user}))
  })  
})

router.get('/user-account',verifyLogin,(req,res)=>{
  let user = req.session.user

  console.log(user);
  res.render('user/account',{user}) 
}) 

router.post('/updateUserProfile',
              verifyLogin,
              userController.updateUserDetails
            ); 

router.get('/changepassword',verifyLogin,(req,res)=>{
  console.log(req.body.pass);  
  let user = req.session.user
  res.render("user/changePassword",{user, "msg": req.session.msg})
  req.session.msg = null;
})

router.post('/newPassword',async(req,res)=>{
  userId = req.session.user._id
  console.log("passw",req.session.user.Pass);
  let newPass1 = await bcrypt.hash(req.session.user.Pass, 10)
  let newPass = await bcrypt.hash(req.body.password, 10)
  if(newPass1 == newPass){
  user = await userHelpers.updatePass(userId,newPass) 
  req.session.msg = "change success" 
    console.log(":user    trueeee"); 
  }else{
    req.session.msg = "not matching"
  }
  res.redirect('/changepassword')
})

router.get('/Invoice',verifyLogin,async(req,res)=>{
    let user = req.session.user._id
    let cartItems = await userHelpers.getCartProducts(user)
    let total = await userHelpers.getTotalAmount(user)
    let d = new Date()
    let date = [ d.getDate() ,d.getMonth(), d.getFullYear()]
    date[1]+=1;
    console.log("cartItems : ",cartItems);
    console.log("total :",total);    
  res.render('user/bill',{cartItems,total,date,User:req.session.user})
  console.log("User :",req.session.user);
})

router.post('/check-coupon',verifyLogin,async(req,res)=>{
  await productHelpers.checkCouponOffer(req.body.code,req.session.user._id)
  .then((ress)=>{
    if(ress.isUsed){
        let isUsed = true;
        res.json({ isUsed })
    }else{
    console.log("db sstus:",ress)
    res.json({ress,user:true})
    }
  })
})

module.exports = router;
