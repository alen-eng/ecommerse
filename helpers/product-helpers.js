const { Collection } = require('mongodb');
var db=require('../config/connection')
var ObjectID=require('mongodb').ObjectId
var collection=require('../config/collections');
const bcrypt=require('bcrypt');
const { reject } = require('bcrypt/promises');
const { required } = require('nodemon/lib/config');
//const collections = require('../config/collections');
module.exports={
    addProduct:(product,callback)=>{
        console.log(product);

        db.get().collection('product').insertOne(product).then((data)=>{
            console.log(data);
          callback(data.insertedId)
         })
    },
    getAllProducts:()=>{
 return new Promise(async(resolve,reject)=>{
let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
resolve(products)
     })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            console.log(proId);
            console.log(ObjectID(proId));
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:ObjectID(proId)}).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    getproductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectID(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectID(proId)},{
                $set:{
                    Name:productDetails.Name,
                    Description:productDetails.Description,
                    Category:productDetails.Category,
                    Price:productDetails.Price
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    doadminLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
            if(admin){
                 bcrypt.compare(adminData.Password,admin.Password).then((status)=>{
                      if(status){
                          console.log('Login success');
                          response.admin=admin
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
    getUserDetails:()=>{
        return new Promise(async(resolve,reject)=>{
        let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
        resolve(users)
        })
    },
    deleteUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).deleteOne({_id:ObjectID(userId)}).then(()=>{
                resolve()
            })
        })
    },
    getOrderDetails:()=>{
        return new Promise(async(resolve,reject)=>{
         let allorders=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $unwind:'$products'
              },
              {
                $project:{
                    item:'$products.item',
                    address:'$deliveryDetails.address',
                    date:'$date',
                    user:'$userId',
                    status:'$status',
                    amount:'$totalAmount'
                }
              },
              {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                },
             },
             {
                $lookup:{
                    from:collection.USER_COLLECTION,
                    localField:'user',
                    foreignField:'_id',
                    as:'user'
                },
             },
             {
                $project:{
                    item:1,
                    address:1,
                    date:1,
                    product:{$arrayElemAt:['$product',0]},
                    user:{$arrayElemAt:['$user',0]},
                    status:1,
                    amount:1
                }
            }
         ]).toArray()
         resolve(allorders)
    })
    },
    updateStatus:(orderId,proId)=>{
   return new Promise((resolve,reject)=>{
     db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectID(orderId),'products.item':ObjectID(proId)},
     {

        $set:{
           status:"Shipped (Expected delivery within 10 days)"
              }

    })
    .then((response)=>{
        resolve(response)
    })
    })
    },
    deliveryStatus:(orderId,proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectID(orderId),'products.item':ObjectID(proId)},
            {
       
               $set:{
                  status:"Out for Delivery"
                     }
       
           })
           .then((response)=>{
               resolve(response)
           })
           })
    }
}