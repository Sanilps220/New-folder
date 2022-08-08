const { resolve, reject } = require('promise');
var db = require('../config/connection')
var collection = require('../config/collections');
const { response } = require('../app');
var objectId = require('mongodb').ObjectId
module.exports={

    addProducts:(product,callback)=>{
        console.log('oooooop');
        console.log(product);
        let varId= new objectId()
      let products={
            _id:product._id,
            name:product.name,
            details: product.details,
            price: parseInt(product.price),
            discount: parseInt(product.discount),
            category: product.category,
            brand:product.brand,
            productVariants:[{
                variantId:varId,
                productQuantity: parseInt(product.quantity),
            }]           
        }
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne( products)
        .then((data)=>{
            callback(data)            
        })         
    },

    getVar:(id)=>{
        console.log("updation of variants",id);
        let varId= new objectId()
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(id)},
        {
            $set:{
                productVariants:[{
                    variantId:varId,
                    productQuantity: 0,
                }] 
            }
        }
        )
        resolve()
    },

    getAllProducts:()=>{
        return new Promise(async function(resolve,reject){
            let products =await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },
    getOfferProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let offer= await db.get().collection(collection.PRODUCT_COLLECTION).find({discount:{"$gte":10}}).toArray()
           
            resolve(offer)
        })
    },

    addtoWishlist:(id,userId)=>{
        let productObj = {
            item: objectId(id),
            quantity:1,
        };
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.WISHLIST_COLLECTION)
            .findOne({user:userId})

            if(userCart){
               
             let prodIndex = userCart.products.findIndex((product) =>product.item == id )
    console.log(prodIndex);
            if(prodIndex != -1){
                db.get().collection(collection.WISHLIST_COLLECTION)
                .updateOne(
                    {user:userId,"products.item":objectId(id)},
                    {
                        $inc:{"products.$.quantity":1}
                    })
                    .then((response)=>{
                    resolve();
                    });
                    
            }else{
                db.get().collection(collection.WISHLIST_COLLECTION)
                .updateOne({
                    user:userId
                },{
                   $push:{ products:productObj }, 
                })
                .then((response)=>{
                    resolve();
                })
            }
        }else{
            let cartObj={
                user:userId,
                products:[productObj]
            };
            db.get().collection(collection.WISHLIST_COLLECTION)
            .insertOne(cartObj)
            .then((result)=>{
                console.log('Added to Wish');
                resolve(result);
            })
        }
        })
    },

    getWishlist:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let wishList = await db.get().collection(collection.WISHLIST_COLLECTION)
            .aggregate([
                {
                    "$match":{user:userId}
                },
                {
                    "$unwind":"$products"
                },
                {
                    "$project":{
                        "item":"$products.item",
                        "quantity":"$products.quantity"
                    }
                },
                {
                    "$lookup":{
                        from:collection.PRODUCT_COLLECTION,
                        localField:"item",
                        foreignField:"_id",
                        as:"product"
                    }
                },
                {
                    "$project":{
                        "item":1,
                        "quantity":1,
                       "product": { $arrayElemAt:["$product",0] },    
                    }
                }
            ])
            .toArray()
            console.log(wishList);
            resolve(wishList)
        })
    },

    removeWish:(user,proId)=>{

        console.log("db Call",proId);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.WISHLIST_COLLECTION)
            .updateOne(
                {_id:objectId(proId)},
                {
                $pull:{products: { item: objectId(user)} } 
            })
            console.log(resolve);
            resolve()
        })
    },

    deleteProducts:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },

    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
           db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((response)=>{    
            resolve(response)
            })
        })
    },

    updateProduct:(proId,proDetails)=>{
        console.log(proDetails);
        var m = parseInt(proDetails.price)
        var quan = parseInt(proDetails.quantity)
        var dis = parseInt(proDetails.discount)
        console.log('-------');
        console.log(m);
        return new Promise(async(resolve,reject)=>{
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId.id)},{
                $set:{
                    name:proDetails.name,
                    details:proDetails.details,
                    price:m,
                    category:proDetails.category,
                    quantity:quan,
                    brand:proDetails.brand,
                    discount:dis
                }
            })
            .then(async(result)=>{
                    await db
                    .get().collection(collection.PRODUCT_COLLECTION)
                    .updateOne({"productVariants.variantId": objectId(proId.varId)},{
                        $set:
                          {
                            "productVariants.$.productQuantity":quan,

                          }
                         })
                    })
                resolve(product);
            })
    },
    getOneProduct:(id)=>{
        return new Promise(async(resolve,reject)=>{
            let pro = await db.get().collection(collection.PRODUCT_COLLECTION)
            .find({_id:objectId(id)}).toArray()
            resolve(pro)
        })
    },
    getUserOrders:()=>{
        return new Promise(async(resolve,reject)=>{
           orders = await db.get().collection(collection.ORDER_COLLECCTION)
            .find({}
                //{"orderObj.status":"placed"}
            )
            .toArray() 
            resolve(orders)
        })  
    },

    placeOrders:function(proId,now){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECCTION)
            .updateOne({_id:objectId(proId)},
            {
                $set:{"orderObj.status":now.status,
                "orderObj.shipDate":new Date(),
                "status":true
            }
            }
            ).then(()=>{
                resolve()
            })
        })
    },

    getOrderProducts: (proId) => {      
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECCTION).aggregate([
                {
                    "$match":{ "_id": objectId(proId) },

                },           
                {
                    "$unwind": '$orderObj.products',
                },
                {
                    "$project": {
                        "item": "$orderObj.products.item",
                        "quantity": "$orderObj.products.quantity",     
                    },
                },
                {
                    "$lookup":{
                        "from":collection.PRODUCT_COLLECTION,
                        "localField":"item",
                        "foreignField":"_id",
                        "as":'product',
                    },
                },
                {
                    "$project":{
                        "product":{$arrayElemAt:["$product",0]},"quantity":1,"item":1,    
                    },
                }, 
            ])
            //  {
            //         $unwind: "$product.productVariants"
            //     },
            //     {
            //         $sort:{date:-1}
            //     }nara
           
            .toArray();
            resolve(orderItems)
            console.log(orderItems);
            }); 
    },
    checkCouponOffer:(couponId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let couponExist = await db.get().collection(collection.COUPON_COLLECTION)
            .findOne({couponCode:couponId})
            if(couponExist){
                console.log("coupon Exist");
                let isUsed = await db.get().collection(collection.COUPON_COLLECTION)
                .findOne(
                {
                    couponCode:couponId,
                    usedUsers: {
                        $elemMatch: {
                            userId: objectId(userId)
                        }
                    }
                }
                )
                if(isUsed){
                    resolve({isUsed:true})
                }
                else{
                    resolve({status:true,couponExist})
                }
            }else{
                console.log("pot valid coupon");
                resolve({status:false})
            }
        })
    },
    getSalesReport:(fromDate,tillDate)=>{
        fromDate=new Date(fromDate)
        tillDate=new Date(tillDate)
        console.log(fromDate+" :"+tillDate);
       return new Promise(async(resolve,reject)=>{

        let salesReport = await db.get().collection(collection.ORDER_COLLECCTION).aggregate([
            {
              $unwind: "$orderObj.products"
            },
            {
              $project:{
                
                item: "$orderObj.products.item",
                quantity: "$orderObj.products.quantity",
                subTotal: "$orderObj.totalAmount",
                status: "$orderObj.status",
                date: "$orderObj.date"
              }
            }
            ,
            {
              $match: {
                 $or:[ {status: "Delivered"},{status: "Shipped"},{status:"Packed"},{status: "shipped"}, {status: "placed"}],
                 date:{
                   $gte:fromDate,
                    $lte:tillDate
                 }
              }}
            ,
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "item",
                foreignField: "_id",
                as: "products"
              }
            }
            ,
            {
              $unwind: "$products"
            }
            ,
            {
              $project:{
                
                quantity:1,
                //price:1,
                products: "$products",
                productName: "$products.brand",
                price:"$products.price",
                productCategory: "$products.category"
              }
            }
            ,
            {
              $unwind: "$products.productVariants"
            }
            ,
            {
              $project:{
                price:1,
                quantity:1,
                //variantId:1,
                productQuantity :"$products.productVariants.productQuantity",
                //  subTotal:1,
                 productCategory: "$products.category",
                 productName: "$products.brand",
                productVariants: "$products.productVariants"
              }
            }
            ,
            {
              $group:{
                 _id: "$productName",
                 totalQty: {$sum: "$quantity"},
                totalSale: {$sum: "$price"},
                productVariants: {"$first": "$productVariants"},
                netCost: {
                  $sum:{
                    $multiply: ["$quantity","$price"]
                   // $multiply: ["$quantity","$productVariants.landingCost"]
                  }
                },
               },
            }
            ,
            {
              $project:{
                _id:1,
                totalQty:1,
                totalSale:1,
                //productVariants:1,
                netCost:1,
                profit: {
                  $subtract:["$totalSale","$netCost"]
                }
              }
            }
          ]).toArray()
          
          console.log('==========');
          resolve(salesReport)
        })
      }
} 