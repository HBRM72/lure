/* ===== Lure — Shared Cart Logic ===== */
(function(){
  var CART_KEY = 'lure_cart_v1';

  function getCart(){
    try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch(e){ return []; }
  }
  function setCart(cart){
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderBadge();
    renderDrawer();
  }
  function parsePrice(p){ return parseInt(String(p).replace(/[^0-9]/g,''),10) || 0; }
  function formatNumber(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function addToCart(item){
    var cart = getCart();
    var existing = null;
    for(var i=0;i<cart.length;i++){
      if(cart[i].name === item.name && cart[i].size === item.size){ existing = cart[i]; break; }
    }
    if(existing){ existing.qty += item.qty; }
    else{ cart.push(item); }
    setCart(cart);
  }
  function removeAt(idx){ var cart = getCart(); cart.splice(idx,1); setCart(cart); }
  function setQtyAt(idx, qty){
    var cart = getCart();
    if(!cart[idx]) return;
    if(qty < 1){ removeAt(idx); return; }
    cart[idx].qty = qty;
    setCart(cart);
  }
  function cartCount(){
    return getCart().reduce(function(sum,i){ return sum + i.qty; }, 0);
  }
  function cartTotal(){
    return getCart().reduce(function(sum,i){ return sum + i.qty * parsePrice(i.price); }, 0);
  }

  /* ---------- UI injection ---------- */
  function injectNavCart(){
    var pill = document.querySelector('.cta-pill');
    if(!pill || document.getElementById('cartFab')) return;

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'cart-fab';
    fab.id = 'cartFab';
    fab.innerHTML = '<span class="fab-label">Bag</span><span class="cart-badge" id="cartBadge">0</span>';

    if(pill.parentNode && pill.parentNode.classList.contains('navicons')){
      pill.parentNode.insertBefore(fab, pill);
    } else if(pill.parentNode){
      var wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      pill.parentNode.insertBefore(wrap, pill);
      wrap.appendChild(fab);
      wrap.appendChild(pill);
    }
  }

  function injectDrawer(){
    if(document.getElementById('cartOverlay')) return;
    var overlay = document.createElement('div');
    overlay.className = 'cart-drawer-overlay';
    overlay.id = 'cartOverlay';
    overlay.style.display = 'none';
    overlay.innerHTML =
      '<div class="cart-drawer">' +
        '<div class="cart-drawer-head"><h3>Your Bag</h3><button type="button" class="cart-close" id="cartClose">&times;</button></div>' +
        '<div class="cart-items" id="cartItems"></div>' +
        '<div class="cart-drawer-foot">' +
          '<div class="cart-total-row"><span>Total</span><span id="cartTotal">Rs. 0</span></div>' +
          '<button type="button" class="add-bag" id="cartCheckoutBtn">Checkout</button>' +
          '<button type="button" class="wish-btn" id="cartContinue">Continue Shopping</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  function injectCheckoutModal(){
    if(document.getElementById('checkoutModal')) return;
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'checkoutModal';
    modal.style.display = 'none';
    modal.innerHTML =
      '<div class="modal-box cart-modal-box">' +
        '<button type="button" class="modal-close" id="modalClose">&times;</button>' +
        '<div class="modal-step" id="stepForm">' +
          '<div class="eyebrow">Almost There</div>' +
          '<h3>Complete Your Order</h3>' +
          '<div class="cart-order-summary" id="orderSummary"></div>' +
          '<form id="checkoutForm">' +

            '<div class="form-section-title">General Information</div>' +
            '<label>Full Name *<input type="text" name="fullName" placeholder="e.g. Sujata Shrestha" required></label>' +
            '<label>Email<input type="email" name="email" placeholder="e.g. sujata@email.com"></label>' +
            '<label>Phone Number *<input type="tel" name="phone" placeholder="e.g. 98XXXXXXXX" required></label>' +
            '<label>Order Note<textarea name="note" placeholder="Any message for us"></textarea></label>' +

            '<div class="form-section-title">Delivery Address</div>' +
            '<label>City / District *<input type="text" name="city" placeholder="e.g. Kathmandu &ndash; inside Ring Road" required></label>' +
            '<label>Address *<input type="text" name="address" placeholder="House no., street, tole" required></label>' +
            '<label>Landmark<input type="text" name="landmark" placeholder="e.g. near Bhatbhateni"></label>' +

            '<div class="form-section-title">Payment Method</div>' +
            '<div class="pay-options" id="payOptions">' +
              '<label class="pay-option checked"><input type="radio" name="payment" value="Cash on Delivery" checked> Cash on Delivery</label>' +
              '<label class="pay-option"><input type="radio" name="payment" value="eSewa"> eSewa</label>' +
              '<label class="pay-option"><input type="radio" name="payment" value="Khalti"> Khalti</label>' +
              '<label class="pay-option"><input type="radio" name="payment" value="Bank Transfer"> Bank Transfer</label>' +
            '</div>' +

            '<button type="submit" class="modal-submit">Confirm Order</button>' +
            '<p class="modal-note">We&rsquo;ll call to confirm before dispatch.</p>' +
          '</form>' +
        '</div>' +
        '<div class="modal-step" id="stepDone" style="display:none;">' +
          '<div class="modal-check">&#10003;</div>' +
          '<h3>Order Received</h3>' +
          '<p>Thank you<span id="doneName"></span> &mdash; we&rsquo;ve got your order. Our team will call you shortly to confirm delivery details.</p>' +
          '<button type="button" class="modal-submit" id="modalDoneClose">Done</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  /* ---------- Rendering ---------- */
  function renderBadge(){
    var badge = document.getElementById('cartBadge');
    if(!badge) return;
    var n = cartCount();
    badge.textContent = n;
    badge.style.display = n > 0 ? 'inline-flex' : 'none';
  }

  function renderDrawer(){
    var wrap = document.getElementById('cartItems');
    if(!wrap) return;
    var cart = getCart();
    if(cart.length === 0){
      wrap.innerHTML = '<p class="cart-empty">Your bag is empty.<br>Go find something pretty.</p>';
    } else {
      wrap.innerHTML = cart.map(function(item, idx){
        return '<div class="cart-item">' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + escapeHtml(item.name) + '</div>' +
            '<div class="cart-item-meta">Size ' + escapeHtml(item.size) + ' &middot; Rs. ' + formatNumber(parsePrice(item.price)) + '</div>' +
          '</div>' +
          '<div class="cart-item-qty">' +
            '<button type="button" class="cart-qty-btn" data-idx="' + idx + '" data-dir="down">&minus;</button>' +
            '<span>' + item.qty + '</span>' +
            '<button type="button" class="cart-qty-btn" data-idx="' + idx + '" data-dir="up">+</button>' +
          '</div>' +
          '<button type="button" class="cart-remove" data-idx="' + idx + '" aria-label="Remove item">&times;</button>' +
        '</div>';
      }).join('');
    }
    var totalEl = document.getElementById('cartTotal');
    if(totalEl){ totalEl.textContent = 'Rs. ' + formatNumber(cartTotal()); }

    wrap.querySelectorAll('.cart-qty-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        var cart = getCart();
        var dir = btn.getAttribute('data-dir') === 'up' ? 1 : -1;
        setQtyAt(idx, cart[idx].qty + dir);
      });
    });
    wrap.querySelectorAll('.cart-remove').forEach(function(btn){
      btn.addEventListener('click', function(){
        removeAt(parseInt(btn.getAttribute('data-idx'), 10));
      });
    });
  }

  function renderOrderSummary(){
    var el = document.getElementById('orderSummary');
    if(!el) return;
    var cart = getCart();
    el.innerHTML = cart.map(function(item){
      return '<div class="summary-line"><span>' + escapeHtml(item.name) + ' &times; ' + item.qty +
        ' (Size ' + escapeHtml(item.size) + ')</span><span>Rs. ' + formatNumber(item.qty * parsePrice(item.price)) + '</span></div>';
    }).join('') +
    '<div class="summary-total"><span>Total</span><span>Rs. ' + formatNumber(cartTotal()) + '</span></div>';
  }

  /* ---------- Open / close ---------- */
  function openDrawer(){
    var o = document.getElementById('cartOverlay');
    if(o){ o.style.display = 'flex'; o.classList.add('open'); }
  }
  function closeDrawer(){
    var o = document.getElementById('cartOverlay');
    if(o){ o.classList.remove('open'); o.style.display = 'none'; }
  }

  function openCheckout(){
    if(cartCount() === 0) return;
    closeDrawer();
    renderOrderSummary();
    var stepForm = document.getElementById('stepForm');
    var stepDone = document.getElementById('stepDone');
    if(stepForm) stepForm.style.display = '';
    if(stepDone) stepDone.style.display = 'none';
    var modal = document.getElementById('checkoutModal');
    if(modal){ modal.style.display = 'flex'; modal.classList.add('open'); }
  }
  function closeCheckout(){
    var m = document.getElementById('checkoutModal');
    if(m){ m.classList.remove('open'); m.style.display = 'none'; }
  }

  /* ---------- Wiring ---------- */
  function wireGlobalEvents(){
    var fab = document.getElementById('cartFab');
    if(fab) fab.addEventListener('click', openDrawer);

    var cartClose = document.getElementById('cartClose');
    if(cartClose) cartClose.addEventListener('click', closeDrawer);

    var overlay = document.getElementById('cartOverlay');
    if(overlay) overlay.addEventListener('click', function(e){ if(e.target === overlay) closeDrawer(); });

    var continueBtn = document.getElementById('cartContinue');
    if(continueBtn) continueBtn.addEventListener('click', closeDrawer);

    var checkoutBtn = document.getElementById('cartCheckoutBtn');
    if(checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);

    var modal = document.getElementById('checkoutModal');
    var modalClose = document.getElementById('modalClose');
    if(modalClose) modalClose.addEventListener('click', closeCheckout);
    if(modal) modal.addEventListener('click', function(e){ if(e.target === modal) closeCheckout(); });

    var modalDoneClose = document.getElementById('modalDoneClose');
    if(modalDoneClose) modalDoneClose.addEventListener('click', closeCheckout);

    var payOptions = document.getElementById('payOptions');
    if(payOptions){
      payOptions.querySelectorAll('.pay-option').forEach(function(opt){
        opt.addEventListener('click', function(){
          payOptions.querySelectorAll('.pay-option').forEach(function(o){ o.classList.remove('checked'); });
          opt.classList.add('checked');
        });
      });
    }

    var form = document.getElementById('checkoutForm');
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        var fd = new FormData(form);
        var name = (fd.get('fullName') || '').toString().trim();
        var doneName = document.getElementById('doneName');
        if(doneName) doneName.textContent = name ? (', ' + name.split(' ')[0]) : '';
        var stepForm = document.getElementById('stepForm');
        var stepDone = document.getElementById('stepDone');
        if(stepForm) stepForm.style.display = 'none';
        if(stepDone) stepDone.style.display = '';
        setCart([]);
        form.reset();
        var payOpts = document.querySelectorAll('#payOptions .pay-option');
        payOpts.forEach(function(o, i){ o.classList.toggle('checked', i === 0); });
      });
    }
  }

  function wireAddToCartButtons(){
    document.querySelectorAll('.add-bag[data-product]').forEach(function(btn){
      if(btn.dataset.cartWired) return;
      btn.dataset.cartWired = '1';
      var originalLabel = btn.textContent;
      btn.addEventListener('click', function(){
        var scope = btn.closest('.details') || document;
        var sizeGroup = scope.querySelector('.sizes');
        var activeSize = sizeGroup ? sizeGroup.querySelector('button.active') : null;
        if(sizeGroup && !activeSize){
          btn.textContent = 'Select a size first';
          setTimeout(function(){ btn.textContent = originalLabel; }, 1600);
          return;
        }
        var qtyEl = scope.querySelector('.qty span');
        var qty = qtyEl ? parseInt(qtyEl.textContent, 10) || 1 : 1;

        addToCart({
          name: btn.getAttribute('data-product'),
          price: btn.getAttribute('data-price'),
          size: activeSize ? activeSize.textContent : '-',
          qty: qty
        });

        btn.textContent = 'Added to Bag ✓';
        btn.classList.add('added');
        openDrawer();
        setTimeout(function(){
          btn.textContent = originalLabel;
          btn.classList.remove('added');
        }, 1400);
      });
    });
  }

  function init(){
    injectNavCart();
    injectDrawer();
    injectCheckoutModal();
    wireGlobalEvents();
    wireAddToCartButtons();
    renderBadge();
    renderDrawer();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
