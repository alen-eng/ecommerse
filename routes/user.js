var express = require('express');
 var fs = require('fs');
 var path=require('path');
// var fs=require('fs-extra');
const res = require('express/lib/response');
const async = require('hbs/lib/async');
const { response } = require('../app');
const { USER_COLLECTION } = require('../config/collections');
var router = express.Router();

const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');

const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }
  else{
    res.redirect('/login')
  }
}

//var MongoClient=require('mongodb').MongoClient
/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
  let cartCount= await userHelpers.getCartCount(req.session.user._id)
 // console.log(user);
  productHelpers.getAllProducts().then((products)=>{
   // console.log(products);
    res.render('user/view-products', {admin:false, products,user,cartCount})
  
  })}else{
    productHelpers.getAllProducts().then((products)=>{
      // console.log(products);
       res.render('user/view-products', {admin:false, products,user,cartCount})
    })
  }
//  res.render('index', {products, admin: false} );
});
router.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }else{
  res.render('user/login',{"loginerr":req.session.userLoginerr})
  req.session.userLoginerr=false
  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
  console.log(req.body);
   userHelpers.doSignup(req.body).then((response)=>{
    function callback(err) {
      if (err) throw err;
      console.log('source.txt was copied to destination.txt');
    }
     fs.copyFile('./public/images/image.jpg','./public/profile-images/'+response._id+'.jpg',callback);
     //fs.move('./public/images/image.jpg','./public/profile-images/'+response._id+'.jpg')
    // fs.readFile('./public/images/image.jpg', function read(err, data) {
    //   if (err) {
    //       throw err;
    //   }
    //   let image = data;
    //   image.data('./public/profile-images/'+response._id+'.jpg')
    //   // console.log(content);
    // })
    console.log(response);
    req.session.user=response
    req.session.userLoggedIn=true
    res.redirect('/')
  })
})

router.post('/login', (req,res)=>{
userHelpers.doLogin(req.body).then((response)=>{
   if(response.status){
     req.session.user=response.user
     req.session.userLoggedIn=true
     res.redirect('/')
   }else{
     req.session.userLoginerr=true
     res.redirect('/login')
   }
  })
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
})
router.get('/cart',verifyLogin,async(req,res)=>{
let products= await userHelpers.getCartProducts(req.session.user._id)
let totalValue=0
if(products.length>0){
  totalValue=await userHelpers.getTotalAmount(req.session.user._id)
}
console.log(req.session.user);
  res.render('user/cart',{products,user:req.session.user._id,user:req.session.user,totalValue})
})
router.get('/add-to-cart/:id',(req,res)=>{
  console.log("Api call");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    // res.redirect('/')
    res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res,next)=>{
userHelpers.changeProductQuantity(req.body).then(async(response)=>{
  console.log(response);
  response.totalAmount=await userHelpers.getTotalAmount(req.body.user)
  res.json(response)

})
})
router.get('/place-order',verifyLogin,async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})
router.post('/place-order',async(req,res)=>{
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await  userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
   console.log(orderId);
    if(req.body['payment-method']=='POD'){
      res.json({podSuccess:true})
    }
  else{
    userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
     res.json(response)
    })
  }
  })
  console.log(req.body);
})
router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})
router.get('/orders',async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
})
router.get('/view-order-products/:id',async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
 // console.log(products);
  res.render('user/view-order-products',{user:req.session.user,products})
})
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(()=>{
    console.log('hi');
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("Payment Successful");
    res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false})
  })
})
router.get('/profile',verifyLogin,async(req,res)=>{
   let details= await userHelpers.fetchDetails(req.session.user._id)
  let prodetails= await userHelpers.fetchprodetails(req.session.user._id)
  res.render('user/profile',{user:req.session.user,details,prodetails})
})
router.get('/profileedit',(req,res)=>{
  res.render('user/profileedit',{user:req.session.user})
})
router.post('/profileedit',verifyLogin,(req,res)=>{
  userHelpers.updateProfile(req.session.user._id,req.body).then(()=>{
  res.redirect('/profile')
  if(req.files.Image){
  let image=req.files.Image
  image.mv('./public/profile-images/'+req.session.user._id+'.jpg')
  // userHelpers.updateProfile(req.session.user._id,req.body)
  }
  //   userHelpers.updateProfile(req.session.user._id,req.body)
  // res.redirect('/profile')
})
})
module.exports = router;
