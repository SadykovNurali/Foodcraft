/* ==========================================================
   Food Craft — static data (loaded before script.js)
   Kept in JS (not fetched) so the site also works when
   opened straight from the file system.
   ========================================================== */
window.FC_DATA = {
  // Meals offered by Food Craft. price is in KZT (₸).
  meals: [
    { id: "pancakes", name: "Protein Pancakes with Berries", cat: "breakfast", kcal: 410, protein: 28, price: 1900, img: "protein-pancakes-berries.jpg", desc: "Fluffy oat pancakes with fresh berries for a strong start to the day." },
    { id: "oatmeal", name: "Protein Oatmeal with Banana", cat: "breakfast", kcal: 350, protein: 25, price: 1500, img: "protein-oatmeal-banana.jpg", desc: "Slow carbs and whey protein — the classic pre-workout breakfast." },
    { id: "avocado-toast", name: "Avocado Toast with Eggs", cat: "breakfast", kcal: 380, protein: 18, price: 1800, img: "avocado-toast-eggs.jpg", desc: "Whole-grain toast, creamy avocado and two soft eggs." },
    { id: "parfait", name: "Greek Yogurt Parfait", cat: "breakfast", kcal: 290, protein: 20, price: 1400, img: "greek-yogurt-parfait.jpg", desc: "Layers of yogurt, granola and berries — light but protein-rich." },
    { id: "omelette", name: "Veggie Omelette", cat: "breakfast", kcal: 260, protein: 21, price: 1500, img: "veggie-omelette.jpg", desc: "Three-egg omelette with peppers, spinach and tomatoes." },
    { id: "quinoa-bowl", name: "Quinoa Power Bowl", cat: "lunch", kcal: 450, protein: 18, price: 2300, img: "quinoa-power-bowl.jpg", desc: "Quinoa, roasted vegetables, chickpeas and herb dressing." },
    { id: "turkey-wrap", name: "Turkey Spinach Wrap", cat: "lunch", kcal: 360, protein: 28, price: 1700, img: "turkey-spinach-wrap.jpg", desc: "Whole-grain wrap with lean turkey, spinach and yogurt sauce." },
    { id: "veggie-wrap", name: "Turkey Veggie Wrap", cat: "lunch", kcal: 340, protein: 26, price: 1700, img: "turkey-veggie-wrap.jpg", desc: "A quick wrap with turkey and crunchy seasonal vegetables." },
    { id: "chicken-bowl", name: "Chicken Rice Bowl", cat: "lunch", kcal: 500, protein: 38, price: 2200, img: "chicken-rice-bowl.jpg", desc: "Grilled chicken with rice, cucumber and cherry tomatoes." },
    { id: "lentil-soup", name: "Lentil Soup", cat: "lunch", kcal: 280, protein: 16, price: 1300, img: "lentil-soup.jpg", desc: "Warm, filling and high in fiber — great on a cold Astana day." },
    { id: "chicken-rice", name: "Grilled Chicken & Rice", cat: "post-workout", kcal: 520, protein: 45, price: 2500, img: "grilled-chicken-rice.jpg", desc: "The muscle-gain staple: lean chicken breast with steamed rice." },
    { id: "salmon", name: "Baked Salmon with Vegetables", cat: "post-workout", kcal: 480, protein: 40, price: 3200, img: "baked-salmon-vegetables.jpg", desc: "Omega-3 rich recovery dinner with oven-roasted vegetables." },
    { id: "sweet-potato", name: "Sweet Potato Chicken Bowl", cat: "post-workout", kcal: 540, protein: 42, price: 2600, img: "sweet-potato-chicken-bowl.jpg", desc: "Roasted sweet potato, chicken and greens to refill glycogen." },
    { id: "shrimp", name: "Grilled Shrimp Skewers", cat: "post-workout", kcal: 310, protein: 36, price: 3000, img: "grilled-shrimp-skewers.jpg", desc: "Light, high-protein skewers with lemon and garlic." },
    { id: "shake", name: "Greek Yogurt Shake", cat: "snack", kcal: 280, protein: 30, price: 1400, img: "greek-yogurt-shake.jpg", desc: "A quick recovery shake you can drink on the way home." },
    { id: "chia", name: "Chia Seed Pudding", cat: "snack", kcal: 220, protein: 9, price: 1200, img: "chia-seed-pudding.jpg", desc: "A light snack full of fiber and omega-3." },
    { id: "nuts", name: "Mixed Nuts & Dried Fruit", cat: "snack", kcal: 240, protein: 7, price: 1000, img: "mixed-nuts-dried-fruit.jpg", desc: "Slow-release energy for long study sessions and training days." }
  ],

  // Meal-builder ingredients: kcal, protein (g), price (KZT)
  ingredients: {
    base: [
      { id: "rice", name: "Brown rice", kcal: 140, protein: 3, price: 600 },
      { id: "quinoa", name: "Quinoa", kcal: 120, protein: 4, price: 700 },
      { id: "sweetpotato", name: "Roasted sweet potato", kcal: 112, protein: 2, price: 550 },
      { id: "wrap", name: "Whole-grain wrap", kcal: 130, protein: 4, price: 400 }
    ],
    protein: [
      { id: "chicken", name: "Grilled chicken breast", kcal: 165, protein: 31, price: 900 },
      { id: "salmon", name: "Baked salmon", kcal: 208, protein: 22, price: 1500 },
      { id: "turkey", name: "Sliced turkey", kcal: 135, protein: 29, price: 800 },
      { id: "shrimp", name: "Grilled shrimp", kcal: 99, protein: 24, price: 1200 },
      { id: "lentils", name: "Stewed lentils", kcal: 116, protein: 9, price: 500 },
      { id: "eggs", name: "Boiled eggs (2)", kcal: 143, protein: 13, price: 400 }
    ],
    veg: [
      { id: "avocado", name: "Avocado & greens", kcal: 120, protein: 2, price: 500 },
      { id: "roasted", name: "Roasted vegetables", kcal: 80, protein: 3, price: 400 },
      { id: "spinach", name: "Spinach & tomato", kcal: 40, protein: 3, price: 300 },
      { id: "cucumber", name: "Cucumber & cabbage slaw", kcal: 35, protein: 1, price: 250 }
    ],
    dressing: [
      { id: "olive", name: "Olive oil & herbs", kcal: 90, protein: 0, price: 300 },
      { id: "yogurt", name: "Yogurt sauce", kcal: 50, protein: 2, price: 250 },
      { id: "tahini", name: "Lemon tahini", kcal: 70, protein: 2, price: 350 }
    ]
  },

  // Delivery zones (Astana)
  zones: [
    { id: "campus", name: "Astana IT University Campus", time: "15–20 min", min: 1500, fee: 0 },
    { id: "expo", name: "EXPO & Mega Silk Way area", time: "25–35 min", min: 2500, fee: 500 },
    { id: "leftbank", name: "Left Bank center", time: "30–45 min", min: 3000, fee: 700 }
  ],

  team: [
    { name: "Asanali Kusmangaliev", role: "content", roleLabel: "Content", text: "Writes the website content and organizes information about food and nutrition." },
    { name: "Nurali Sadykov", role: "research", roleLabel: "Research & Design", text: "Researches healthy food and sport, and shapes how the pages look and feel." },
    { name: "Danial Zhambyl", role: "development", roleLabel: "Development", text: "Builds the pages with HTML, CSS and JavaScript and keeps the layout consistent on every screen." }
  ]
};
