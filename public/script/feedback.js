//get the form by its id
const form = document.getElementById("contact-form"); 

const formEvent = form.addEventListener("submit", (event) => {
   event.preventDefault();
  let mail = new FormData(form);
  sendMail(mail);
  alert("Feedback Sent !!")
  form.reset();
})

const sendMail = (mail) => {
    fetch("/send", {
      method: "post",
      body: mail,
  
    }).then((response) => {
      return response.json();
    });
  };
  