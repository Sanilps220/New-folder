var express = require('express');
const { response } = require('../app');
var router = express.Router();
var fs = require('fs')
var productHelpers = require('../Helpers/product-helpers')
var adminHelpers = require('../Helpers/admin-helpers')
var userHelpers = require('../Helpers/user-helpers');
const nodemailer = require("nodemailer");
const env = require("dotenv").config()
const { verify } = require('crypto');
const admin={
  name:"admin",
  pass:123
}

console.log(env.parsed.SENT_MAIL) // remove this after you've confirmed it working
const verifyLogin=(req,res,next)=>{
  //let admin = adminHelpers.verify()
  if(req.session.admin ){
    next();
    }else{
      res.render('admin/login-page',{ad:true})
    }
}
 
/* GET users listing. */
router.get('/', verifyLogin,async function(req, res, next) {
  var admin =req.session.admin
  let users = await adminHelpers.getCount()
  let active = await adminHelpers.getActiveCount()
  let products = await adminHelpers.getProductCount()
  let order = await adminHelpers.getOrderCount()
  let topwear = await adminHelpers.getItemsCount('Rayon Fabric  ')
  let shirt = await adminHelpers.getItemsCount('Round Neck Printed ')
  let men =await adminHelpers.getGendCount("Men")
  let women =await adminHelpers.getGendCount("Women")
  let stockOut = await adminHelpers.getStockOut()
  console.log(users);
  res.render('admin/dashboard',{admin,users,active,products,order,topwear,men,women,shirt,stockOut})
});


router.post('/login',(req,res)=>{
  console.log(req.body);
  const name= req.body.name;
  const pass= req.body.pass
  if(name =='' || pass == ''){
    req.session.adminErr="Missing. Please check before submit"
    res.render('admin/login-page',{ad:true,msg:req.session.adminErr})
    req.session.adminErr = null
  }
  if(admin.name==name && admin.pass==pass){
    req.session.admin=true
    res.redirect('/admin')
  }else{
    req.session.adminErr="Invalid Entry"
    res.render('admin/login-page',{ad:true,msg:req.session.adminErr})
    req.session.adminErr = null
  }
})

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/admin')
})

router.get('/add-product',verifyLogin,(req,res)=>{
  adminHelpers.getBrand().then((allBrand) =>{
    console.log(allBrand);
  res.render('admin/add-products',{admin:req.session.admin,allBrand}); 
  }) 
});

router.get('/view-products', verifyLogin, function(req, res, next) {
  var admin =req.session.admin
  productHelpers.getProductManagement().then((products)=>{
    console.log(products);     
    res.render('admin/view-products',{admin,products})
  })
}); 

router.post('/add-product',(req,res)=>{
  console.log(req.body);
   productHelpers.addProducts(req.body,(id)=>{
    console.log(JSON.stringify(id.insertedId));
    var ID = id.insertedId
    let image = req.files.image
    image.mv('./public/product-images/'+ID+'.jpg',(err)=>{
      
      if(!err){
        mesg="Successfully Submited"
        res.render("admin/add-products",{admin:true,mesg})
      }else{
        mesg="Something wrong"+err;
        res.render("admin/add-products",{admin:true,mesg})
      }
    })
    
  })
})

router.post('/add-brand',(req,res)=>{
  console.log(req.body);
  productHelpers.addBrand(req.body.brand).then(()=>{
  res.redirect('/admin/add-product')
})
})

router.get('/edit-product/:id',async(req,res)=>{
 let products =await productHelpers.getProductDetails(req.params.id)
 if(products){
  if(!products.productVariants){
    productHelpers.getVar(req.params.id)
    }
    adminHelpers.getBrand().then((allBrand) =>{
    if(allBrand){
    res.render('admin/edit-products',{allBrand,products,admin:req.session.admin})
   } 
})
 }else{
res.render('admin/edit-products',{products,admin:req.session.admin}) 
}
})


router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  productHelpers.deleteProducts(proId).then((response)=>{
    res.redirect('/admin/view-products')
  })
    
})

router.post('/edit-product/',(req,res)=>{
  console.log(req.query.varId);
  console.log(req.files);
  productHelpers.getOneProduct(req.query.id).then((result)=>{
     let proId= req.query.id; 
     let varId= req.query.varId;
     let image = req.files?.image;
     let prodImg1 = req.files?.image_1;
     let prodImg2 = req.files?.image_2;
     let prodImg3 = req.files?.image_3;

     if(image){
      fs.unlink(
        `./public/product-images/${proId}.jpg`,
        (err,data)=>{
          if(!err){
            image.mv('./public/product-images/'+proId+'.jpg')
          }
          else{
            console.log("no maching images 0 ");
          }
        }
      )
     }if(prodImg1){
      fs.unlink(
        `./public/product-images/${proId}/${varId}_1.jpg`,
        (err,data)=>{
          if(!err){
            console.log("success :img 1");
           
          } prodImg1.mv( `./public/product-images/sample/${varId}_1.jpg`)
          
        }        
      )
         
      
     }if(prodImg2){
      fs.unlink(
        `./public/product-images/sample/${varId}_2.jpg`,
        (err,data)=>{
          if(!err){
           
          } prodImg2.mv('./public/product-images/sample/'+varId+'_2.jpg')
         
            console.log("no maching images 2");
          
        }
      )
     } if(prodImg3){
      fs.unlink(
        `./public/product-images/sample/${varId}_3.jpg`,
        (err,data)=>{
          if(!err){
           console.log("img 3 succeess");
          } prodImg3.mv('./public/product-images/sample/'+varId+'_3.jpg')
        }
      )
     }
  })
  //let id = req.params.id
  //console.log(req.files.image_1);
   productHelpers.updateProduct(req.query,req.body).then(()=>{
   res.redirect('/admin/view-products')
  //   if(req.files){
  //     let image = req.files.image
  //     image.mv('./public/product-images/'+id+'.jpg')
  //   }
   })
})


router.get("/orders",verifyLogin,async(req,res)=>{
  let orders = await productHelpers.getUserOrders()
  console.log("Orders :"); 
  res.render('admin/orders',{res:true,orders,admin:req.session.admin})
})

router.post('/place-product/:id',(req,res)=>{
  console.log(req.body.status); 
if(req.body.status == "Delivered"){
    


// async..await is not allowed in global scope, must use a wrapper

    let transporter = nodemailer.createTransport({
    service:"gmail",
    auth: {
      user: "sanilps220@gmail.com", // generated ethereal user
      pass: env.parsed.SENT_MAIL, // generated ethereal password
    },
    });
  
    transporter.sendMail({   // send mail with defined transport object
    from:"sanilps220@gmail.com" , // 👻sender address
    to:"sanilsabu22@gmail.com" , // list of receivers
    subject: "Shopiy ✔", // Subject line
    text: "Hello world?", // plain text body
    html: `<!DOCTYPE html>
    <html>
    
    <head>
    
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <style type="text/css">
        /* CLIENT-SPECIFIC STYLES */
        body,
        table,
        td,
        a {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
    
        table,
        td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
    
        img {
          -ms-interpolation-mode: bicubic;
        }
    
        /* RESET STYLES */
        img {
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
        }
    
        table {
          border-collapse: collapse !important;
        }
    
        body {
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }
    
        /* iOS BLUE LINKS */
        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: none !important;
          font-size: inherit !important;
          font-family: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
        }
    
        /* MEDIA QUERIES */
        @media screen and (max-width: 480px) {
          .mobile-hide {
            display: none !important;
          }
    
          .mobile-center {
            text-align: center !important;
          }
    
          .align-center {
            max-width: initial !important;
          }
    
          h1 {
            display: inline-block;
            margin-right: auto !important;
            margin-left: auto !important;
          }
        }
    
        @media screen and (min-width: 480px) {
          .mw-50 {
            max-width: 50%;
          }
        }
    
        /* ANDROID CENTER FIX */
        div[style*="margin: 16px 0;"] {
          margin: 0 !important;
        }
    
        :root {
          --purple: #5a3aa5;
          --pink: #b91bab;
          --blue: #2cbaef;
          --green: #23c467;
        }
      </style>
    </head>
    
    <body style="margin: 0 !important; padding: 0 !important; background-color: #eeeeee;" bgcolor="#eeeeee">
    
      <!-- HIDDEN PREHEADER TEXT -->
      <div
        style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Open Sans, Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
       MESSAGE FROM SHOPIY!
      </div>
    
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="background-color: #eeeeee;" bgcolor="#eeeeee">
    
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:100%;">
              <tr>
                <td align="center" height="6"
                  style="background-image: linear-gradient(to right, #b91bAb, #5a3aa5); background-color: #b91bAb;"
                  bgcolor="#b91bAb"></td>
              </tr>
            </table>
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:800px;">
              <tr>
                <td align="center" valign="top" style="background-color: #ffffff; font-size:0; padding: 35px 35px 0;"
                  bgcolor="#ffffff">
    
                  <div style=" text-align: center; max-width:50%;  vertical-align:top; width:100%;">
                    <table class="align-center" border="0" cellpadding="0" cellspacing="0" width="100%"
                      style="max-width:800px;">
                      <tr>
                        <td align="left" height="48" valign="center"
                          style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size:48px; font-weight: 800; line-height: 48px;"
                          class="mobile-center">
                          <div class="text-center">
                            <span style="color: #ff9500;">S <span style="color: #000;">HOPIY</span> </span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </div>
    
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 0 15px 20px 15px; background-color: #ffffff;" bgcolor="#ffffff">
    
                  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                    <tr>
                      <td align="center"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 25px;">
                        <img src="http://healthplang.com/App_Themes/GHP/images/icon-check-mark.png" width="125" height="120"
                          style="display: block; border: 0px;" /><br>
                        <h2 style="font-size: 30px; font-weight: 800; line-height: 36px; color: #333333; margin: 0;">
                          Hey  buddey,Your order has been ready to out of delivering Thank You For Your Order!
                        </h2>
                      </td> </tr>
                   
                    <tr>
                      <td align="center"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 10px;">
                        <p style="font-size: 16px; font-weight: 400; line-height: 24px; color: #777777; padding: 0 30px;">
    
    
                         
                          Please keep in touch!
    
                         
                        </p>
                      </td>
                    </tr>
    
    
              </tr>
            </table>
    
          </td>
        </tr>
        `
    
        
       
       //${userEmail[0].deliveryDetails.name}${userEmail[0].products[0].status}       
     // html body
  });
}
  productHelpers.placeOrders(req.params.id,req.body).then(()=>{
    res.redirect('/admin/orders')
  })

})

router.get('/userDetails',verifyLogin,(req,res)=>{
  userHelpers.getUser().then((resolve)=>{
    res.render('admin/userDetails',{users:resolve, admin:req.session.admin})
  })
})

router.post("/block-user",verifyLogin,(req,res)=>{
  adminHelpers.blockUser(req.body.id).then((resp)=>{
    console.log(resp);
    if (resp){
      res.redirect('/admin/userDetails')
    }else{
    res.json({status:false})
    }
  })
})

router.get('/remove-user/:id',verifyLogin,(req,res)=>{
  adminHelpers.removeUser(req.params.id).then((resp)=>{
    res.redirect('/admin/userDetails')
  })
})

router.post("/unblock-user",(req,res)=>{
  adminHelpers.unblockUser(req.body.id).then((resp)=>{
    console.log(resp);
    if (resp){
      res.redirect('/admin/userDetails')
    }else{
    res.json({status:false})
    }
  })
})

router.get('/view-pass/:id',verifyLogin,(req,res)=>{
  adminHelpers.viewPass(req.params.id).then((resp)=>{
    res.send({pass})
  })
})

router.get("/cancelOrder/:id",(req,res)=>{
console.log('para',req.params);
adminHelpers.cancelOrder(req.params.id)
res.redirect('/admin/orders')
})

router.get('/coupon',verifyLogin,(req,res)=>{
  if(req.session.mesg){
    let msg =req.session.mesg
    res.render('admin/coupon',{admin:true,msg})
    req.session.mesg = false
  }else{
  res.render('admin/coupon',{admin:true})
  }
})

router.post('/addCoupon',async(req,res)=>{
  console.log(req.body);
  await adminHelpers.addCoupon(req.body)
  req.session.mesg = "Coupon added success.."
  res.redirect('/admin/coupon')
})

router.get('/salesReport',verifyLogin,async(req,res)=>{
  //verifyLogin, let fromDate = new Date(req.query.fromDate)
  // let tillDate = new Date(req.query.tillDate)
  let salesReport = await productHelpers.getSalesReport(req.query.fromDate,req.query.tillDate)
  console.log(salesReport);
  //res.render('admin/sales-report',{salesReport})
res.render('admin/sales-report',{admin:true,salesReport})
})



module.exports = router;
 