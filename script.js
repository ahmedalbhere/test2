const firebaseConfig = {
  databaseURL: "https://coffee-dda5d-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentTable = null;

function enterTable() {
  const table = document.getElementById('tableNumber').value;
  if (table) {
    currentTable = table;
    document.getElementById('table-input').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    loadMenu();
  }
}

function loadMenu() {
  db.ref("menu").on("value", snapshot => {
    const itemsDiv = document.getElementById('menu-items');
    itemsDiv.innerHTML = '';
    const items = snapshot.val();
    for (let key in items) {
      const item = items[key];
      itemsDiv.innerHTML += `
        <div class="item">
          <strong>${item.name}</strong><br>
          السعر: ${item.price} جنيه<br>
          <input type="number" placeholder="الكمية" id="qty-${key}"><br>
          <textarea placeholder="ملاحظات" id="note-${key}"></textarea>
        </div>
      `;
    }
  });
}

function submitOrder() {
  const order = { table: currentTable, items: [] };
  db.ref("menu").once("value").then(snapshot => {
    const items = snapshot.val();
    for (let key in items) {
      const qty = document.getElementById(`qty-${key}`).value;
      const note = document.getElementById(`note-${key}`).value;
      if (qty && qty > 0) {
        order.items.push({ name: items[key].name, qty, note });
      }
    }
    db.ref("orders").push(order);
    document.getElementById('menu').style.display = 'none';
    document.getElementById('order-summary').style.display = 'block';
  });
}
