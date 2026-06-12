const payload = {
  restaurant_id: 4343,
  order_id: "998877",
  order_from: "SWIGGY",
  customer_details: {
    name: "John Doe",
    phone_number: "9876543210",
    email: "john@example.com",
    address: "St. 5, Sector 4, Mumbai",
    delivery_area: "Andheri"
  },
  order_items: [
    {
      item_name: "Paneer Butter Masala",
      item_quantity: 2,
      item_unit_price: 250,
      variants: [
        { size_name: "Full" }
      ],
      addons: [
        { name: "Extra Butter" }
      ]
    }
  ],
  net_amount: 500,
  gross_amount: 550,
  cgst: 15,
  sgst: 15,
  delivery_charge: 20,
  order_packaging: 0,
  discount: 0,
  order_otp: "1234",
  password: "PASSWORD_ABC",
  is_train_order: false,
  order_instructions: "Make it spicy"
};

async function test() {
  try {
    const response = await fetch('http://localhost:3000/ol/api/v1/getOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status Code:', response.status);
    const data = await response.json();
    console.log('Response body:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();
