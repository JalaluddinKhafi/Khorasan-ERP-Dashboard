document.getElementById('loginForm').addEventListener('submit',async event=>{
    event.preventDefault();const button=document.getElementById('loginBtn');if(button.disabled)return;
    button.disabled=true;document.getElementById('loginError').textContent='';
    try{await OrgContext.login(document.getElementById('loginUsername').value,document.getElementById('loginPassword').value);location.href='dashboard.html';}
    catch(error){document.getElementById('loginError').textContent=error.message;}
    finally{button.disabled=false;}
});
