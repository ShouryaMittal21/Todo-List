//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { error } = require("console");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect("mongodb+srv://Shourya21:shourya21@cluster0.hq0jdcm.mongodb.net/todolistDB");
mongoose.connect(process.env.MONGO_URL);

const itemSchema = {
  name: String
};

const Item = new mongoose.model("Item",itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name:"Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.>"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({})
  .then(function(foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
      .then(function () {
        console.log("Successfully saved defult items to DB");
      })
      .catch(function (error) {
        console.log(error);
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName == "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName})
    .then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete",function(req,res){
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkItemId)
    .then(function(){
      console.log('Deleted');
    })
    .catch(function(error){
      console.log(error);
    })
    res.redirect("/")
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkItemId}}})
    .then(function(foundList){
      res.redirect("/" + listName);
    })
    .catch(function(error){
      console.log(error);
    });
  }
});

app.get("/:todoListName",function(req, res){
  const customListName = _.capitalize(req.params.todoListName);
  List.findOne({name: customListName})
  .then(function(foundList){
    if(!foundList){
      const list = new List({
        name: customListName,
        items : defaultItems
      });
      list.save();
      res.redirect("/"+customListName);
    }
    else{
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch(function(error){
    console.log(error);
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

const port = process.env.port || 3000

app.listen(port, function() {
  console.log("Server started on port 3000");
});
