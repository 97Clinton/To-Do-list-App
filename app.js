//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://ClinJS:Clinton97@cluster0.8gv1alh.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser: true});
const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  
  Item.find({}).then(function(foundItems){
    if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
        .then(function() {
          console.log("Successfully saved default items to DB.");
      })
      .catch(function(err) {
        console.log(err);
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  });

});


app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
    .then(function(foundList) {
      
        if(!foundList){
          //Create new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });
        
          list.save();
      
          res.redirect("/" + customListName);
        } else {
          //Show existing list
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
          
        }     
    })
    .catch(function (err) {
      console.log(err);
    });

    
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
    .then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch(function(err){
      console.log(err);
    });
  }
  
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkedItem;
  const listName = req.body.listName;

  if( listName === "Today"){
    Item.findByIdAndRemove(checkedItemId).then(() =>{
        console.log("Successfully deleted checked item.");
        res.redirect("/");  
    })
    .catch((err)=>{
      console.log(err);
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then(function(foundList){
        res.redirect("/" + listName);
    })
    .catch(function(err){
      console.log(err);
    });
  }
});

app.get("/users/:userId", function(req, res){
  res.send(req.params);
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
