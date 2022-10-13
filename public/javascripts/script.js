        function addToCart(proId){
            $.ajax({
                url:'/add-to-cart/'+proId,
                method:'get',
                success:(response)=>{ 
                    console.log("add calll")                  
                    if(response.status){                       
                        let count=$('#cart-count').html()
                        count=parseInt(count)+1
                        $("#cart-count").html(count)
                       
                    }else{
                       swal({
                        title:"Login Please",
                        text:"It Easy do logged in",
                        button:true,
                        dangerMode:true
                       })
                       .then(()=>{
                        location.href="/login"                        
                       })
                    }
                }
            })
        }
        
        function wishlist(id){
            let alerts = document.getElementById('alerts')
            $.ajax({
                url:'/wishlist/'+id,
                method:'get',
                success:(response)=>{
                    alerts.innerHTML='<div class="alert alert-primary sb" role="alert"> This is added to Wishlist! </div>'
                   setTimeout(function(){alerts.classList.add("hide")},600);
                }
            })
        }

        function sendDatas(e){
            let search= document.getElementById('search')
            let searchValue = document.getElementById('sugest')
            let searchResult = document.getElementById('sugest')
            val=e.value
            console.log('kk',val)
            $.ajax({
                url:'/searchDatas',
                method:'get',
                data:{search:val},
                success:(resp)=>{
                    console.log(resp)
                    let search = resp.payload
                    search.innerHTML = `<a> ${search.brand}</a>`
                }
            })
        }

        function sendData(e){
           let searchValue =  document.getElementById('join')
           console.log(searchValue)
           let searchResult = document.getElementById('searchResult')
           let match = e.value.match(/^[a-zA-Z]*/)
           let match2 = e.value.match(/\s*/)
           
           console.log('mat 2',match2)
           
           
           if(match2[0] === e.value){
            searchResult.innerHTML=''
            return
           }
           if(match[0] === e.value){ 
            val = e.value
                      $.ajax({
                url: '/searchPro',
                method:'post',
                data: {payload:val},
                success:(response)=>{
                    console.log(response)
                    let payload = response.payload
                    searchResult.innerHTML = ''
            if(payload.length < 1){
                searchResult.innerHTML = '<p>Sorry, Nothing Found </p>'
                return;
            }
            payload.forEach((item,length)=>{               
                searchResult.innerHTML += `<div><a href="/localSer/${item.name}"> <p style="text-decoration: none;" > ${item.name} </p></a></div>`
            })
                }
                })
            

            return
           }
        }
       
        function getProductDetails(proId){
        $.ajax({
            url:'/local?id='+proId ,
            method:'get',
            // success:(response)=>{
            //     console.log(response)
            //     if(response){
            //         window.location.replace('/local',{products:response})
            //     }href="\local\'${item._id}'"
            //}onclick="getProductDetails('${item._id}')
         success:(data)=>{
            console.log('data',data)
            alert("success")
            window.location.replace('/local')
         }
        })
        }

       // function editUser(userId){
    //         let val = document.getElementById('sts')
    //         console.log(val)
            
    //         if(val.innerHTML  == "Unblock"){
    //  value = "Block"
    //             val.innerHTML  = "Block"
    //         } if(val.innerHTML  == "Blocked"){
    //  value = "Unblock"
    //             val.innerHTML  = "Unblock"
    //         }
            // $.ajax({
            //     url:'/admin/editStatus?id='+userId+'&val='+value,
            //     method:'get',
            //     success:(response)=>{
            //         alert(response.status)
            //     }
            // })
        //}
