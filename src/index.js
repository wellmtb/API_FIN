const { request, response } = require('express');
const express = require('express');
const {v4: uuidv4} = require('uuid')
const app = express();
app.use(express.json());
const customers = [];

//midleware
function VerifyIfExistsAccountCPF(request, response,next){
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

if(!customer){
  return response.status(400).json({error:"Customer not found!"});
}
request.customer = customer;
return next();
}

function getBalance(statement){
const balance = statement.reduce((acc,operation)=>{

  if(operation.type ==="Credit"){
    return acc + operation.amount;
  }else{
    return acc - operation.amount;
  }

},0)
  return balance;
}

app.post("/account", (request, response)=>{
  const {cpf, name } = request.body;
  const customeralreadyexists = customers.some((customers)=> customers.cpf === cpf
  );
  if(customeralreadyexists){
    return response.status(400).json({error: "Customer already exists !"})
  }
  customers.push({
    cpf,
    name,
    id : uuidv4(),
    statement: []
  })
  console.log(customers);
  return response.status(201).send();
});

app.post("/deposit", VerifyIfExistsAccountCPF, (request, response)=>{
  const { description , amount} = request.body;
  const { customer } = request;

  
  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "Credit"
  }
customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.get("/statement", VerifyIfExistsAccountCPF, (request, response)=>{
  const { customer} = request;
  return response.json(customer.statement)
});

app.post("/withdraw", VerifyIfExistsAccountCPF,(request,response)=>{
  const { amount } = request.body;
  const {customer} = request;

  const balance = getBalance(customer.statement);
  console.log(balance);
  
  if(balance < amount){
    return response.status(400).json({error:"Insufficient founds"})
  };
  
  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "Debit"
  }
customer.statement.push(statementOperation);
  return response.status(201).send();

});


app.get("/statement/date", VerifyIfExistsAccountCPF, (request, response)=>{
  const { customer} = request;
  const{ date } = request.query;

  const dateFormat = new Date(date.toLocaleString('en-US') + " 00:00");
console.log("Data Query " + dateFormat)
  const statement = customer.statement.filter(
    (statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())
  
  return response.json(statement);
});

app.put("/account", VerifyIfExistsAccountCPF,(request , response)=>{
  const { name } = request.body;
  const {customer} = request;
  customer.name = name;
  return response.status(200).send();
});

app.get("/account", VerifyIfExistsAccountCPF,(request , response)=>{
  const {customer} = request;

  return response.json(customer).status(200).send();
});

app.delete("/account", VerifyIfExistsAccountCPF,(request , response)=>{
  const {customer} = request;

  customers.splice(customer,1);

  return response.status(200).json(customers).send();
});

app.get("/balance", VerifyIfExistsAccountCPF,(request , response)=>{
  const {customer} = request;

  const balance = getBalance(customer.statement)

  return response.json(balance).status(200).send();
});

app.listen(3000)