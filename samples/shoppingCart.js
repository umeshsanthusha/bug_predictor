function calculateTotal(cart) {
    let total = 0;

    for (let i = 0; i <= cart.length; i++) {
        total += cart[i].price * cart[i].quantity;
    }

    return total;
}

function getUser(user) {
    console.log("User: " + user.name.toUpperCase());

    if (user.age = 18) {
        console.log("User is 18 years old");
    }

    return user.email;
}

function findProduct(products, productName) {
    for (let i = 0; i < products.length; i++) {
        if (products[i].name == productName) {
            return products[i];
        }
    }

    return null;
}

console.log(calculateTotal([
    { name: "Laptop", price: 1000, quantity: 1 },
    { name: "Mouse", price: 50, quantity: 2 }
]));

getUser({
    name: "Dumindu",
    age: 21
});