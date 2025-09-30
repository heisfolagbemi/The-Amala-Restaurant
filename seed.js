const mongoose = require('mongoose');

const responseModel = require("./ResponseModel");


await responseModel.create({
    trigger: 1,
    reply: [{
        id: 1, name: "Amala,Ewedu Soup and Protein, Price: N2,500"
    },
        {
        id: 2, name: "Amala,Gbegiri Soup and Protein, Price: N2,500"
        },
        {
        id: 3, name: "Amala,Ewedu and Gbegiri Soup with Protein, Price: N3,000"
        },
        {
        id: 4, name: "Eba,Ewedu Soup and Protein, Price: N2,500"
        },
        {
        id: 5, name: "Jollof Rice, Protein and Drink, Price: N3,000"
        },
        {
        id: 6, name: "Fried Rice, Protein and Drink, Price: N3,000"
        }]    
},
    {
    trigger: 99,
    reply
}
)

