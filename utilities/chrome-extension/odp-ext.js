var script = document.createElement('script');
//script.src = "http://www.disappearing.us/client/odp-0.0.1.js";
script.src = "http://localhost:8080/client/odp-0.0.1.js";
document.body.appendChild(script);
var odp = document.createElement('div');
odp.id = "our-disappearing-present";
odp.classList.add("round","top","right"); 
document.body.appendChild(odp);