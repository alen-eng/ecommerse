var express = require('express');
const res = require('express/lib/response');
const async = require('hbs/lib/async');
const { Admin } = require('mongodb');
const { render, response } = require('../app');
const productHelpers = require('../helpers/product-helpers');
const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }
  else{
    res.redirect('/admin/admin-login')
  }
}

var router = express.Router();
var productHelper=require('../helpers/product-helpers')
/* GET users listing. */
router.get('/',verifyLogin, function(req, res, next) {
productHelpers.getAllProducts().then((products)=>{
  res.render('admin/view-products', {admin:true, products})
  console.log(products)
})
  
});

router.get('/add-product',function(req,res){
  res.render('admin/add-product')
})
router.post('/add-product', (req,res)=>{
//console.log(req.body);
//if(!req.files){ Image = "";}
//if(req.files){
//console.log(req.files.Image);
//}
productHelpers.addProduct(req.body,(id)=>{
  let image=req.files.Image
  console.log(id);
  image.mv('./public/product-images/'+id+'.jpg',(err)=>{
    if(!err){
      res.render("admin/add-product")
    }
    else{
      console.log(err);
    }
  })
 })
})
router.get('/delete-product/:id',(req,res)=>{
let proId=req.params.id
console.log(proId);
productHelpers.deleteProduct(proId).then((response)=>{
res.redirect('/admin/')
   })
})
router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelpers.getproductDetails(req.params.id)
  res.render('admin/edit-product',{product})
})
router.post('/edit-product/:id',(req,res)=>{
  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/product-images/'+id+'.jpg')
      
    }
  })
  
})
router.get('/admin-login',(req,res)=>{
  if(req.session.admin){
    res.redirect('/admin')
  }else{
   res.render('admin/admin-login',{"loginerr":req.session.loginerr})
   req.session.loginerr=false
  }
})
router.post('/admin-login', (req,res)=>{
  productHelpers.doadminLogin(req.body).then((response)=>{
     if(response.status){
       req.session.admin=response.admin
       req.session.adminLoggedIn=true
       res.redirect('/admin')
     }else{
       req.session.loginerr=true
       res.redirect('/admin/admin-login')
     }
    })
  })
  router.get('/admin-logout',(req,res)=>{
    req.session.admin=null
    req.session.adminLoggedIn=false
    res.redirect('/')
  })

router.get('/all-users',verifyLogin,async(req,res)=>{
  users= await productHelpers.getUserDetails()
  res.render('admin/all-users',{admin:true,users})
})
router.get('/all-users/:id',verifyLogin,(req,res)=>{
  let id=req.params.id
  productHelpers.deleteUser(id).then(()=>{
    res.redirect('/admin/all-users')
  })
})
router.get('/all-orders',verifyLogin,async(req,res)=>{
  allorders= await productHelpers.getOrderDetails()
  res.render('admin/all-orders',{admin:true,allorders})
  
})
router.post('/change-status',(req,res)=>{
  productHelpers.updateStatus(req.body.order,req.body.pro).then((response)=>{
    console.log(response);
    if(response){
      res.render('admin/all-orders',{admin:true,response})
    }
  })
})

router.post('/delivery-status',(req,res)=>{
  productHelpers.deliveryStatus(req.body.order,req.body.pro).then((response)=>{
    console.log(response);
    if(response){
      res.render('admin/all-orders',{admin:true,response})
    }
  })
})
module.exports = router;
