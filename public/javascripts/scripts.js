function addtoCart(proId){
    $.ajax({
      url:'/add-to-cart/'+proId,
      method:'get',
      success:(response)=>{
          if(response.status){
       let count=$('#cart-count').html()
       count=parseInt(count)+1
       $("#cart-count").html(count)
          }
          location.reload()
      }
    })
  }

  function updateStatus(ordId,proId){
    $.ajax({
         url:'/admin/change-status',
         data:{
             order:ordId,
             pro:proId
         },
         method:'post',
         success:()=>{
            location.reload()
         }
    })
}

function deliveryStatus(ordId,proId){
  $.ajax({
       url:'/admin/delivery-status',
       data:{
           order:ordId,
           pro:proId
       },
       method:'post',
       success:()=>{
          location.reload()
       }
  })
}

function wishlist(proId){
  $.ajax({
    url:'/add-to-wishlist/'+proId,
    method:'post',
    success:(response)=>{
      console.log(response);
      alert("Product has been added to wishlist")
    }
  })
}