var flag=false;
var form1= document.getElementById("input-form-1");  
form1.addEventListener("submit",getlocation);
function getlocation(event) {  
    event.preventDefault(); 
    document.body.classList.add("ld-over-full-inverse");
    document.body.classList.add("running");
    document.getElementById("myDIV").style.display = "block";
    var x = document.getElementById("lat"); 
    var y = document.getElementById("long");
    var z = document.getElementById("test");
    if(navigator.geolocation){  
       navigator.geolocation.getCurrentPosition(function(position){
        console.log(position.coords); 
        x.value =  position.coords.latitude 
        y.value =  position.coords.longitude; 
        form1.submit();
        flag=true;
       });
    }  
    else  
    {   
        z.value = "Geolocation is not supported by this browser.";
    } 
} 
if(flag==false){
    var form2= document.getElementById("input-form-2");  
    form2.addEventListener("submit",getlocation)
    function getlocation(event) {  
        event.preventDefault(); 
        document.body.classList.add("ld-over-full-inverse");
        document.body.classList.add("running");
        document.getElementById("myDIV").style.display = "block";
        var x = document.getElementById("lat2"); 
        var y = document.getElementById("long2");
        var z = document.getElementById("test3");
        if(navigator.geolocation){  
           navigator.geolocation.getCurrentPosition(function(position){
            console.log(position.coords); 
            x.value =  position.coords.latitude 
            y.value =  position.coords.longitude; 
            form2.submit()
           });
        }  
        else  
        {   
            z.value = "Geolocation is not supported by this browser.";
        } 
    }  
    
} 

var form3= document.getElementById("input-form-3");  
form3.addEventListener("submit",getlocationMain)
function getlocationMain(event){
    event.preventDefault(); 
    document.body.classList.add("ld-over-full-inverse");
    document.body.classList.add("running");
    document.getElementById("myDIV").style.display = "block";
    var x = document.getElementById("lat3"); 
    var y = document.getElementById("long3");
    var z = document.getElementById("test3");
    if(navigator.geolocation){  
        navigator.geolocation.getCurrentPosition(function(position){
         console.log(position.coords); 
         x.value =  position.coords.latitude 
         y.value =  position.coords.longitude; 
         form3.submit()
        });
     }  
     else  
     {   
         z.value = "Geolocation is not supported by this browser.";
     }
}

