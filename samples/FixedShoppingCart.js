function calculateTotal(cart) {
    if (!Array.isArray(cart)) {
        throw new TypeError("Cart must be an array.");
    }

    let total = 0;

    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];

        if (
            !item ||
            typeof item.price !== "number" ||
            typeof item.quantity !== "number"
        ) {
            continue;
        }

        total += item.price * item.quantity;
    }

    return total;
}

function getUser(user) {
    if (!user || typeof user !== "object") {
        throw new TypeError("Invalid user object.");
    }

    const userName = user.name ?? "Unknown User";
    console.log(`User: ${userName.toUpperCase()}`);

    if (user.age === 18) {
        console.log("User is 18 years old");
    }

    return user.email ?? null;
}

function findProduct(products, productName) {
    if (!Array.isArray(products)) {
        throw new TypeError("Products must be an array.");
    }

    return (
        products.find(product => product?.name === productName) ?? null
    );
}

console.log(
    calculateTotal([
        {
            name: "Laptop",
            price: 1000,
            quantity: 1
        },
        {
            name: "Mouse",
            price: 50,
            quantity: 2
        }
    ])
);

getUser({
    name: "Dumindu",
    age: 21,
    email: "dumindu@example.com"
});