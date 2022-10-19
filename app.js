//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const _ = require('lodash'); //convert string to title case

const app = express();
app.set('view engine', 'ejs'); // set up ejs for templating
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // to use css files
//connecting to mongodb
const pass = process.env.MONGODB_ADMIN_PASS;
mongoose.connect(process.env.MONGO_URL,{useNewUrlParser: true});


//MongoDB
//making schema
const itemsSchema = {
    item: String
}
//creating model
const Item = mongoose.model("Item", itemsSchema);
//adding default items
const item1 = new Item({
    item: "Hello"
})
const item2 = new Item({
    item: "Welcome to the List" 
})
const item3 = new Item({
    item: "start adding items"
})
const defaultItems = [item1, item2, item3];
//creating new list schema
const listSchema = {
    item: String,
    items: [itemsSchema]
}
const List = mongoose.model("List", listSchema);

let var_day = "";
//Home page or route
app.get('/', (req, res) =>{
    let today = new Date();
    let options = {
        weekday:'long',
        day:'numeric',
        month:'long'
    }
    var_day = today.toLocaleDateString('en-US', options);

    Item.find({},(err,foundItms)=>{
        if(foundItms.length === 0){
            Item.insertMany(defaultItems,(err)=>{
                if(err){
                    console.log(err);
                }else{
                    console.log("Successfully added");
                }
            })
        }else{
            res.render('list',{listTitle:var_day ,newListItems:foundItms});
        }
    })
});

//Dynamic route
app.get('/:customListName',(req,res)=>{
    const customListName=_.capitalize(req.params.customListName);
    List.findOne({item:customListName},(err,foundList)=>{
        if(!err){
            if(!foundList){
                //create new list
                const list = new List({
                    item: customListName,
                    items:defaultItems
                })
                list.save();
                res.redirect("/"+customListName);
            }else{
                //show existing list
                res.render('list',{listTitle:foundList.item ,newListItems:foundList.items});
            }
        }
    })
})

app.post('/',(req,res)=>{
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const itemNew = new Item({
        item: itemName
    })
    if(listName == var_day){
        itemNew.save();
        res.redirect('/');
    }
    else{
        List.findOne({item: listName},(err,foundList)=>{
            foundList.items.push(itemNew);
            foundList.save();
            res.redirect("/"+listName);
        })
    }
});
app.post('/delete',(req,res)=>{
    const checkedId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName === var_day){
        Item.findByIdAndRemove(checkedId,(err)=>{
            if(!err){
                console.log("Successfully deleted");
            res.redirect('/');
            }
        })
    }else{
        List.findOneAndUpdate({item:listName},{$pull:{items:{_id:checkedId}}},
            (err,foundList)=>{
                if(!err){
                    res.redirect("/"+listName);
                }
            })
    }
})


let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port,()=>{
    console.log('Server started');
});