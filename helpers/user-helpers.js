
var db=require('../config/connection')
var collection = require('../config/collections')
const Razorpay=require('razorpay')
var ObjectID=require('mongodb').ObjectId
const bcrypt=require('bcrypt')
const { reject, promise } = require('bcrypt/promises')
const async = require('hbs/lib/async')
const { CART_COLLECTION } = require('../config/collections')
const { response } = require('../app')
const res = require('express/lib/response')
const { resolve } = require('path')
const { parse } = require('querystring')
var instance = new Razorpay({
    key_id: 'rzp_test_obLcKhKkGSvTDW',
    key_secret: '43cNaK5XGbDJWgRt1o0VJEY3',
  });

// const async = require('hbs/lib/async');
// const res = require('express/lib/response');
module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve, reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            userData.Password1=await bcrypt.hash(userData.Password1,10)
            //console.log(userData)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{    
                db.get().collection(collection.PROFILE_COLLECTION).insertOne({_id:data.insertedId,bio:'Enter a bio about you',phone:'',website:'',facebook:'',instagram:'',state:'',city:'',street:'',zipcode:''})
             resolve(userData,data.insertedId)
             
            })

            
        })
      
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                 bcrypt.compare(userData.Password,user.Password).then((status)=>{
                      if(status){
                          console.log('Login success');
                          response.user=user
                          response.status=true
                          resolve(response)
                      }
                      else{
                          console.log('Login fail');
                          resolve({status:false})
                      }
                 })
                }else{
                    console.log('Login Failed');
                    resolve({status:false})
                }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:ObjectID(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=> product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:ObjectID(userId),'products.item':ObjectID(proId)},
                         {
                             $inc:{'products.$.quantity':1}
                         }
                    ).then(()=>{
                        resolve()
                    })
                }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectID(userId)},
                {
                      $push:{products:proObj}
                 }
               ).then((response)=>{
                    resolve()
               })
            }
             }else{
                let cartObj={
                    user:ObjectID(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })

    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectID(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'    
                    }
                },
                {
                  $lookup:{
                      from:collection.PRODUCT_COLLECTION,
                      localField:'item',
                      foreignField:'_id',
                      as:'product'
                    }
                               
                },
                {
                   $project:{
                       item:1,
                       quantity:1,
                       product:{$arrayElemAt:['$product',0]}

                   }
                }

               // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{productList:'$products'},
                //         pipeline:[
                //             {
                //                $match:{
                //                    $expr:{
                //                        $in:['$_id',"$$productList"]
                //                    }
                //                }
                //             }
                //         ],
                //         as:'cartItems'
                //     }
                // }
            ]).toArray()
           // console.log(cartItems[0].products);
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userId)})
            if(cart){
               count=cart.products.length
            }else{
                count=0
            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        count=parseInt(details.count)
        quantity=parseInt(details.quantity)
  return new Promise ((resolve,reject)=>{
      if((count===-1 && quantity===1) || (count===0)){
        db.get().collection(collection.CART_COLLECTION)
        .updateOne({_id:ObjectID(details.cart)},
             {
                 $pull:{products:{item:ObjectID(details.product)}}
             }
        ).then((response)=>{
            resolve({removeProduct:true})
        })
    }else{
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectID(details.cart),'products.item':ObjectID(details.product)},
        {
            $inc:{'products.$.quantity':count}
        }
        ).then((response)=>{
            resolve({status:true})
        })
    }
         })
        },
        getTotalAmount:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:ObjectID(userId)}
                    },
                    {
                        $unwind:'$products'
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'    
                        }
                    },
                    {
                      $lookup:{
                          from:collection.PRODUCT_COLLECTION,
                          localField:'item',
                          foreignField:'_id',
                          as:'product'
                        }
                                   
                    },
                    {
                       $project:{
                           item:1,
                           quantity:1,
                           product:{$arrayElemAt:['$product',0]}
    
                       }
                    },
                        //    {
                        //     input: "$product.Price",
                        //     to: "int",
                        //     onError: "HELLO GUYS",  // Optional.
                        //     onNull: ""    // Optional.
                        //  },
                    //  },
                    //     {
                    //         quantity: parseInt('$quantity'),
                    //         price: parseInt('$product.Price')
                    //     }
                     
                    
                    {
                       $group:{
                            _id:null,
                            total:{$sum:{$multiply:[{$toInt:'$quantity'},{$toInt:'$product.Price'}]}}
                        }
                    }
    
                  
                ]).toArray()
                console.log(total[0].total);
                resolve(total[0].total)
            })
        },
        placeOrder:(order,products,total)=>{
            return new Promise((resolve,reject)=>{
             let status=order['payment-method']=='POD'?'Placed':'Pending'
             let orderObj={
                 deliveryDetails:{
                     mobile:order.mobile,
                     address:order.address,
                     pincode:order.pincode
                 },
                 userId:ObjectID(order.userId),
                 paymentMethod:order['payment-method'],
                 products:products,
                 totalAmount:total,
                 status:status,
                 date:new Date()
             }
             db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                 db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectID(order.userId)})
                 resolve(response.insertedId)
             })
            })
        },
        getCartProductList:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userId)})
                console.log(cart);
                resolve(cart.products)
            })
        },
        getUserOrders:(userId)=>{
             return new Promise(async(resolve,reject)=>{
                 let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectID(userId)}).toArray()
                 console.log(orders);
                 resolve(orders)
             })
        },
        getOrderProducts:(orderId)=>{
               return new Promise(async(resolve,reject)=>{
                   let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                       {
                          $match:{_id:ObjectID(orderId)}
                       },
                       {
                         $unwind:'$products'
                       },
                       {
                         $project:{
                             item:'$products.item',
                             quantity:'$products.quantity'
                         }
                       },
                       {
                          $lookup:{
                              from:collection.PRODUCT_COLLECTION,
                              localField:'item',
                              foreignField:'_id',
                              as:'product'
                          }
                       },
                       {
                           $project:{
                               item:1,
                               quantity:1,
                               product:{$arrayElemAt:['$product',0]}
                           }
                       }
                   ]).toArray()
                   //console.log(orderItems)
                   resolve(orderItems)
               })
        },
        generateRazorpay:(orderId,total)=>{
            return new Promise((resolve,reject)=>{

                instance.orders.create({
                    amount: total*100,
                    currency: "INR",
                    receipt: ""+orderId,
                    notes: {
                      key1: "value3",
                      key2: "value2"
                    }
                  },function(err,order){
                    if(err){
                        console.log(err);
                    }
                    else{
                console.log("new order", order);
                resolve(order)
                    }
                    });



                // var options={
                //     amount: total,
                //     currency: "INR",
                //     receipt: ""+orderId
                // };
                // instance.orders.create(options, function(err,order){
                //     if(err){
                //         console.log(err);
                //     }
                //     else{
                // console.log("new order", order);
                // resolve(order)
                //     }
                // });  
            })
        },
        verifyPayment:(details)=>{
            return new Promise((resolve,reject)=>{
                const crypto=require('crypto');
                var hmac=crypto.createHmac('sha256','43cNaK5XGbDJWgRt1o0VJEY3')
                hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
                hmac=hmac.digest('hex')
                if(hmac==details['payment[razorpay_signature]']){
                    resolve()
                }
                else{
                    reject()
                }
            })
        },
        changePaymentStatus:(orderId)=>{
           return new Promise((resolve,reject)=>{
               db.get().collection(collection.ORDER_COLLECTION).updateOne(
                   {_id:ObjectID(orderId)},
                   {
                       $set:{
                           status:'placed'
                       }
                   }
                   ).then(()=>{
                       resolve()
                   })
           })
        },
        fetchDetails:(userId)=>{
            return new Promise( async(resolve,reject)=>{
                let details= await db.get().collection(collection.USER_COLLECTION).aggregate([
                    {
                        $match:{_id:ObjectID(userId)}
                    },
                    {
                        $project:{
                                Name:1,
                                Email:1
                        }
                    }
                ]).toArray()
                resolve(details)
            })
        },
fetchprodetails:(userId)=>{
    return new Promise(async(resolve,reject)=>{
    let profiledata= await db.get().collection(collection.PROFILE_COLLECTION).aggregate([
        {
            $match:{_id:ObjectID(userId)}
        },
        {
            $project:{
                _id:1,
                phone:1,
                website:1,
                facebook:1,
                instagram:1,
                state:1,
                city:1,
                street:1,
                zipcode:1,
                bio:1,
            }
        }
       ]).toArray()
       resolve(profiledata)
    })
},

        updateProfile:(userId,details)=>{

             return new Promise(async(resolve,reject)=>{
                 let currentProfile= await  db.get().collection(collection.PROFILE_COLLECTION).findOne({_id:ObjectID(userId)})


                 var objForUpdate = {};

            if (details.phone) objForUpdate.phone = details.phone;
            else objForUpdate.phone=currentProfile.phone;
            if (details.website) objForUpdate.website = details.website;
            else objForUpdate.website=currentProfile.website;
            if (details.facebook) objForUpdate.facebook =details.facebook;
            else objForUpdate.facebook=currentProfile.facebook;
            if (details.instagram) objForUpdate.instagram = details.instagram;
            else objForUpdate.instagram=currentProfile.instagram;
            if (details.state) objForUpdate.state = details.state;
            else objForUpdate.state=currentProfile.state;
            if (details.city) objForUpdate.city =details.city;
            else objForUpdate.city=currentProfile.city;
            if (details.street) objForUpdate.street = details.street;
            else objForUpdate.street=currentProfile.street;
            if (details.zipcode) objForUpdate.zipcode = details.zipcode;
            else objForUpdate.zipcode=currentProfile.zipcode;
            if (details.bio) objForUpdate.bio = details.bio;
            else objForUpdate.bio=currentProfile.bio;

               db.get().collection(collection.PROFILE_COLLECTION).updateOne({_id:ObjectID(userId)},
               
               {
                $set: {
                    // objForUpdate
                    phone: objForUpdate.phone,
                    website:objForUpdate.website,
                    facebook:objForUpdate.facebook,
                    instagram:objForUpdate.instagram,
                    state:objForUpdate.state,
                    city:objForUpdate.city,
                    street:objForUpdate.street,
                    zipcode:objForUpdate.zipcode,
                    bio:objForUpdate.bio,
                       }
                }
               ).then((response)=>{
                resolve(response)
            })
             })
        },

        userDetailsValidate:(email)=>{
            return new Promise(async(resolve,reject)=>{
                let currentProfile= await  db.get().collection(collection.USER_COLLECTION).findOne({Email:email})
                if (currentProfile){
                let details= await db.get().collection(collection.USER_COLLECTION).aggregate([
                    {
                        $match:{Email:email}
                    },
                    {
                        $project:{
                                _id:1,
                                Email:1,
                                Password:1,
                        }
                    }
                ]).toArray()
                resolve(details)
            }
            else{
                resolve()
            }
            })
        },
        useridValidate:(userId)=>{
            return new Promise(async(resolve,reject)=>{
              let idvalid=await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectID(userId)})
              if(idvalid){
                let details= await db.get().collection(collection.USER_COLLECTION).aggregate([
                    {
                        $match:{_id:ObjectID(userId)}
                    },
                    {
                        $project:{
                                Email:1,
                                Password:1
                        }
                    }
                ]).toArray()
                resolve(details)
              }
              else{
                  resolve()
              }
            })
        },
        changePassword:(userId,newPassword)=>{
            return new Promise(async(resolve, reject)=>{
                nwPassword=await bcrypt.hash(newPassword,10)
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectID(userId)},
                {
                    $set:{
                        Password:nwPassword,
                        Password1:nwPassword
                    }
                }
                ).then((resolve)=>{
                    resolve({status:true})
                })
            })
        }
}

