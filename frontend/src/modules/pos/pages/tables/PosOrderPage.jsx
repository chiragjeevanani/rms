import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Minus, Trash2, ArrowLeft, ChevronDown, ChevronUp, Bell, Edit3, User,
  Soup, Users
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { printKOTReceipt } from '../../utils/printKOT';
import { printBillReceipt } from '../../utils/printBill';
import { playClickSound } from '../../utils/sounds';
import { MOCK_WAITERS } from '../../data/staff';
import { POS_CATEGORIES, POS_MENU_ITEMS } from '../../data/posMenu';
import toast from 'react-hot-toast';

// ── Color tokens (Now Dynamic) ────────────────────────────────────────────────
const C = {
  sidebarBg:  'var(--primary-color, #ff7a00)',
  sidebarHover: 'color-mix(in srgb, var(--primary-color, #ff7a00), black 10%)',
  sidebarActive: 'color-mix(in srgb, var(--primary-color, #ff7a00), black 20%)',
  tabActive:  'var(--primary-color, #ff7a00)',
  tabInactive:'#EEEEEE',
  billingBg:  'color-mix(in srgb, var(--primary-color, #ff7a00), black 15%)',
  accentTeal: '#00ACC1',
  orange:     'var(--primary-color, #ff7a00)',
  amber:      '#FFC107',
};

export default function PosOrderPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { placeKOT, settleOrder, updateOrderStatus, orders, fetchActiveTableOrders, tables, updateTableStatus } = usePos();

  // ── Menu Data ───────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shortCode, setShortCode] = useState('');

  // ── Order type ─────────────────────────────────────────────────────────────
  const [orderType, setOrderType] = useState('Dine-In');

  // ── Cart ───────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState([]);
  const [selectedWaiter] = useState(MOCK_WAITERS[0]);

  // ── Billing state ──────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isSalesReturn, setIsSalesReturn] = useState(false);
  const [discount] = useState(0);
  const [discountType] = useState('percentage');

  // ── Fetch menu ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const staffInfo = JSON.parse(localStorage.getItem('staff_info') || '{}');
        const branchQuery = staffInfo.branchId ? `?branchId=${staffInfo.branchId}` : '';
        const [cRes, iRes, comboRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/category${branchQuery}`),
          fetch(`${import.meta.env.VITE_API_URL}/item${branchQuery}`),
          fetch(`${import.meta.env.VITE_API_URL}/combo${branchQuery}`).catch(() => ({ json: () => ({ success: false }) })) // graceful fail for combo
        ]);
        const [cData, iData, comboData] = await Promise.all([cRes.json(), iRes.json(), comboRes.json()]);
        
        let cats = [];
        cats.push({ id: 'fav', name: 'Favorite' });
        
        if (Array.isArray(cData) && cData.length > 0) {
          cats = cats.concat(cData.map(c => ({ id: c._id, name: c.name })));
        }
        cats.push({ id: 'combo', name: 'Combo' });
        
        setCategories(cats);
        setSelectedCategory('fav');
        
        let itemsList = [];
        
        if (Array.isArray(iData)) {
          itemsList = itemsList.concat(iData.map(i => ({
            id: i._id, _id: i._id, catId: i.category?._id || i.category,
            name: i.name, price: i.basePrice || i.price || 0,
            shortcut: i.shortcut || '',
            alphaShortCode: i.alphaShortCode || '',
            numericShortCode: i.numericShortCode || '',
            isFeatured: i.isFeatured
          })));
        }
        
        if (comboData && comboData.success && Array.isArray(comboData.data)) {
          itemsList = itemsList.concat(comboData.data.map(c => ({
            id: c._id, _id: c._id, catId: 'combo',
            name: c.name, price: c.price || 0,
            shortcut: 'CMB',
            alphaShortCode: c.alphaShortCode || '',
            numericShortCode: c.numericShortCode || ''
          })));
        }
        
        setMenuItems(itemsList);
      } catch (err) {
        setCategories(POS_CATEGORIES);
        setSelectedCategory(POS_CATEGORIES[0]?.id || null);
        setMenuItems(POS_MENU_ITEMS);
      }
    };
    load();
  }, []);

  // ── Active order ───────────────────────────────────────────────────────────
  const activeOrder = useMemo(() =>
    Object.values(orders).find(o => o.tableName === tableId || o.tableId === tableId),
    [orders, tableId]
  );

  // ── Filtered items ─────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let items = menuItems;
    
    // If there is a search query or shortcode, search globally across all categories
    if (searchQuery || shortCode) {
      if (searchQuery) items = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (shortCode) items = items.filter(i => 
        (i.shortcut || '').toLowerCase().startsWith(shortCode.toLowerCase()) ||
        (i.alphaShortCode || '').toLowerCase().startsWith(shortCode.toLowerCase()) ||
        (i.numericShortCode || '').toString().startsWith(shortCode) ||
        (i.code || '').toString().startsWith(shortCode)
      );
      return items;
    }

    // Otherwise, just show items from the selected category
    if (selectedCategory) {
      if (selectedCategory === 'fav') {
        items = items.filter(i => i.isFeatured);
      } else {
        items = items.filter(i => (i.catId || i.category) === selectedCategory);
      }
    }
    
    return items;
  }, [menuItems, selectedCategory, searchQuery, shortCode]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const key = (i) => i._id || i.id;

  const addToCart = (item) => {
    playClickSound();
    setCart(prev => {
      const ex = prev.find(i => key(i) === key(item));
      if (ex) return prev.map(i => key(i) === key(item) ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const changeQty = (k, delta) => {
    setCart(prev => prev.map(i => key(i) === k ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const removeItem = (k) => { playClickSound(); setCart(prev => prev.filter(i => key(i) !== k)); };

  // ── Financials ─────────────────────────────────────────────────────────────
  const cartSubTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const placedSubTotal = useMemo(() => activeOrder?.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0, [activeOrder]);
  const subTotal = cartSubTotal + placedSubTotal;
  const taxAmt = Math.round(subTotal * 0.05);
  const discAmt = discountType === 'percentage' ? Math.round(subTotal * discount / 100) : discount;
  const grandTotal = Math.max(0, subTotal + taxAmt - discAmt);

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleKOT = async (withPrint = false) => {
    if (!cart.length && !activeOrder) { toast.error('Add items first'); return; }
    playClickSound();

    const items = cart.map(i => ({ itemId: i._id || i.id, name: i.name, quantity: i.quantity, price: i.price }));
    
    // Status should be Pending (Yellow) for KOT
    const financials = {
      tableName: tableId,
      orderType: orderType,
      waiterName: selectedWaiter?.name,
      status: 'Pending',
      subTotal,
      tax: taxAmt,
      discount: { amount: discAmt, type: discountType },
      grandTotal
    };

    const ok = await placeKOT(tableId, items, financials, selectedWaiter);
    if (ok) { 
      if (withPrint) {
        const printItems = [...(activeOrder?.items || []), ...cart];
        printKOTReceipt({ items: printItems }, { name: tableId });
      }
      setCart([]); 
      toast.success(`KOT Sent for ${tableId}`);
    }
  };

  const handleSave = async (withPrint = false) => {
    if (!cart.length && !activeOrder) { toast.error('Nothing to save'); return; }
    playClickSound();
    
    const items = cart.map(i => ({ itemId: i._id || i.id, name: i.name, quantity: i.quantity, price: i.price }));
    
    // Status: 'Billed' (Green) if printing bill, otherwise keep 'Saved' or previous active status
    let newStatus = withPrint ? 'Billed' : (activeOrder?.status || 'Saved');
    // If it was already Pending/Preparing, don't downgrade to Saved
    if (!withPrint && activeOrder && activeOrder.status !== 'Saved') {
      newStatus = activeOrder.status;
    }

    const financials = {
      tableName: tableId,
      orderType: orderType,
      waiterName: selectedWaiter?.name,
      status: newStatus,
      subTotal,
      tax: taxAmt,
      discount: { amount: discAmt, type: discountType },
      grandTotal
    };

    const ok = await placeKOT(tableId, items, financials, selectedWaiter);
    if (ok) { 
      // SMART LOGIC: If printing bill but there were new items in cart, also print the KOT
      if (withPrint && cart.length > 0) {
        printKOTReceipt({ items: cart }, { name: tableId });
      }

      setCart([]); 
      if (withPrint) {
        const allItems = [...(activeOrder?.items || []), ...cart];
        printBillReceipt({ items: allItems, waiter: selectedWaiter },
          { name: tableId }, { subTotal, tax: taxAmt, discount: discAmt, total: grandTotal, orderType });
        toast.success(`Bill Generated for ${tableId}`);
      } else {
        toast.success(`Order Saved for ${tableId}`);
      }
    }
  };

  const handleSettle = async (withPrint = false) => {
    if (!cart.length && !activeOrder) { toast.error('Nothing to settle'); return; }
    playClickSound();

    let targetOrder = activeOrder;

    // If there are new items in cart, save them first
    if (cart.length) {
      const items = cart.map(i => ({ itemId: i._id || i.id, name: i.name, quantity: i.quantity, price: i.price }));
      const financials = {
        tableName: tableId, orderType, waiterName: selectedWaiter?.name,
        status: 'Paid', subTotal, tax: taxAmt,
        discount: { amount: discAmt, type: discountType }, grandTotal
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...financials, items })
      });
      const result = await response.json();
      if (result.success) {
        targetOrder = result.data;
        setCart([]);
      } else {
        toast.error('Failed to save order before settlement');
        return;
      }
    }

    if (!targetOrder) { toast.error('No active order to settle'); return; }

    const ok = await settleOrder(targetOrder._id, [{ method: paymentMethod, amount: grandTotal }]);
    if (ok) {
      if (withPrint) {
        const allItems = targetOrder.items || [];
        printBillReceipt({ items: allItems, waiter: selectedWaiter, settled: true },
          { name: tableId }, { subTotal, tax: taxAmt, discount: discAmt, total: grandTotal, orderType });
      }
      toast.success(`${tableId} Settled Successfully`);
      navigate('/pos/tables');
    }
  };

  const handleClearTable = async () => {
    if (window.confirm(`Clear table ${tableId}?`)) {
      setCart([]);
      const tableObj = tables.find(t => (t.tableName || t.name || '').toLowerCase() === tableId.toLowerCase());
      if (tableObj) {
        await updateTableStatus(tableObj._id, 'Available');
      }
      navigate('/pos/tables');
    }
  };

  const handleReserve = async () => {
    playClickSound();
    const tableObj = tables.find(t => (t.tableName || t.name || '').toLowerCase() === tableId.toLowerCase());
    if (!tableObj) { toast.error('Table not found'); return; }
    const ok = await updateTableStatus(tableObj._id, 'Reserved');
    if (ok) {
      toast.success(`${tableId} Reserved`);
      navigate('/pos/tables');
    }
  };

  // ── All cart + order items combined ────────────────────────────────────────
  const allItems = useMemo(() => {
    const placed = (activeOrder?.items || []).map(i => ({ ...i, placed: true }));
    return [...placed, ...cart.map(i => ({ ...i, placed: false }))];
  }, [activeOrder, cart]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* ══ LEFT: Category Sidebar ══════════════════════════════════════════ */}
      <div style={{ width: 130, background: C.sidebarBg, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        {/* Back button */}
        <div
          onClick={() => navigate('/pos/tables')}
          style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.15)' }}
        >
          <ArrowLeft size={14} color="rgba(255,255,255,0.7)" />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tableId}</span>
        </div>

        {/* Category section header */}
        {categories.length > 0 && (
          <div style={{ padding: '8px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {categories.find(c => c.id === selectedCategory)?.name || 'Categories'}
            </span>
            <ChevronDown size={10} color="rgba(255,255,255,0.4)" />
          </div>
        )}

        {/* Categories list */}
        <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => { playClickSound(); setSelectedCategory(cat.id); }}
              style={{
                padding: '11px 14px',
                cursor: 'pointer',
                background: selectedCategory === cat.id ? C.sidebarActive : 'transparent',
                borderLeft: selectedCategory === cat.id ? `3px solid ${C.amber}` : '3px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (selectedCategory !== cat.id) e.currentTarget.style.background = C.sidebarHover; }}
              onMouseLeave={e => { if (selectedCategory !== cat.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: selectedCategory === cat.id ? '#FFF' : 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', lineHeight: 1.3 }}>
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ CENTER: Menu Items ══════════════════════════════════════════════ */}
      <div style={{ flex: 1, background: '#EEEEEE', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Search row */}
        <div style={{ padding: '8px 10px', background: '#E8E8E8', display: 'flex', gap: 8, borderBottom: '1px solid #D5D5D5' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={13} color="#999" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Item"
              style={{ width: '100%', paddingLeft: 26, paddingRight: 8, paddingTop: 6, paddingBottom: 6, border: '1px solid #CCC', borderRadius: 4, fontSize: 12, outline: 'none', background: '#FFF', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input
              value={shortCode}
              onChange={e => setShortCode(e.target.value)}
              placeholder="Short Code"
              style={{ width: '100%', padding: '6px 10px', border: '1px solid #CCC', borderRadius: 4, fontSize: 12, outline: 'none', background: '#FFF', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Items grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, alignContent: 'start' }} className="no-scrollbar">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => addToCart(item)}
              style={{
                background: '#FFF',
                borderRadius: 4,
                borderLeft: `4px solid ${C.accentTeal}`,
                padding: '10px 12px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                transition: 'all 0.12s',
                userSelect: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontWeight: 700, fontSize: 12, color: '#212121', lineHeight: 1.3 }}>{item.name}</div>
      
              <div style={{ fontSize: 11, color: C.sidebarBg, fontWeight: 800, marginTop: 4 }}>₹{item.price}</div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#BDBDBD', fontSize: 12, fontWeight: 600 }}>
              No items found
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT: Order Panel ═════════════════════════════════════════════ */}
      <div style={{ width: 430, background: '#FFF', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #E0E0E0', flexShrink: 0 }}>

        {/* Order type tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E0E0E0', flexShrink: 0 }}>
          {['Dine-In', 'Delivery', 'Takeaway'].map(tab => (
            <button
              key={tab}
              onClick={() => { playClickSound(); setOrderType(tab); }}
              style={{
                flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                background: orderType === tab ? C.tabActive : C.tabInactive,
                color: orderType === tab ? '#FFF' : '#757575',
                transition: 'all 0.15s',
              }}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Waiter / table info row */}
        <div style={{ display: 'flex', height: 48, borderBottom: '1px solid #E0E0E0', background: '#FFF', flexShrink: 0 }}>
          <InfoBox icon={<Soup size={16} />} label={tableId} active />
          <InfoBox icon={<User size={16} />} />
          <InfoBox icon={<Users size={16} />} label={selectedWaiter?.name?.slice(0, 4) || 'JANE'} />
          <InfoBox icon={<Edit3 size={16} />} />
          <InfoBox icon={<Bell size={16} />} />
          <div style={{ flex: 1, borderRight: '1px solid #F0F0F0' }} />
          <div style={{
            width: 80, background: C.amber, height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 900, color: '#1A1A1A', letterSpacing: '0.05em'
          }}>
            {orderType === 'Dine In' ? 'AC' : 'DEL'}
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: 'flex', padding: '6px 10px', borderBottom: '1px solid #F0F0F0', background: '#FAFAFA', flexShrink: 0 }}>
          <span style={{ flex: 1, fontSize: 10, fontWeight: 800, color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Items</span>
          <span style={{ width: 70, fontSize: 10, fontWeight: 800, color: '#9E9E9E', textTransform: 'uppercase', textAlign: 'center' }}>Check Items</span>
          <span style={{ width: 40, fontSize: 10, fontWeight: 800, color: '#9E9E9E', textTransform: 'uppercase', textAlign: 'center' }}>Qty.</span>
          <span style={{ width: 50, fontSize: 10, fontWeight: 800, color: '#9E9E9E', textTransform: 'uppercase', textAlign: 'right' }}>Price</span>
        </div>

        {/* Items list */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} className="no-scrollbar">
          {allItems.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#BDBDBD', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#9E9E9E' }}>No Item Selected</div>
              <div style={{ fontSize: 11, color: '#BDBDBD', textAlign: 'center' }}>Please Select Item from Left Menu Item</div>
            </div>
          ) : (
            allItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #F5F5F5', background: item.placed ? '#FFFFF0' : '#FFF' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#212121' }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: '#9E9E9E' }}>₹{item.price}</div>
                </div>
                <div style={{ width: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {!item.placed && (
                    <>
                      <button onClick={() => changeQty(key(item), -1)} style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid #E0E0E0', background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <Minus size={10} color="#666" />
                      </button>
                      <span style={{ fontSize: 11, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => changeQty(key(item), 1)} style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid #E0E0E0', background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <Plus size={10} color="#666" />
                      </button>
                    </>
                  )}
                  {item.placed && <span style={{ fontSize: 11, fontWeight: 800, color: '#4CAF50' }}>✓ {item.quantity}</span>}
                </div>
                <span style={{ width: 40, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#555' }}>{item.quantity}</span>
                <span style={{ width: 50, textAlign: 'right', fontSize: 12, fontWeight: 800, color: '#1A1A1A' }}>₹{item.price * item.quantity}</span>
                {!item.placed && (
                  <button onClick={() => removeItem(key(item))} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <Trash2 size={13} color="#EF5350" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* ══ BILLING PANEL ══════════════════════════════════════════════════ */}
        <div style={{ background: C.billingBg, flexShrink: 0 }}>

          {/* Row 1: Payment methods & TOTAL */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '7px 10px', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {['Cash', 'Card', 'UPI'].map(m => (
                <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={() => setPaymentMethod(m)}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${paymentMethod === m ? C.amber : 'rgba(255,255,255,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {paymentMethod === m && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber }} />}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: paymentMethod === m ? '#FFF' : 'rgba(255,255,255,0.55)', textTransform: 'capitalize' }}>{m}</span>
                </label>
              ))}
            </div>

            <div
              style={{ padding: '5px 14px', background: C.amber, borderRadius: 3, color: '#1A1A1A', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
            >
              TOTAL <span style={{ fontWeight: 900 }}>₹{grandTotal}</span>
            </div>
          </div>



          {/* Row 4: Action buttons */}
          <div style={{ display: 'flex', gap: 3, padding: '7px 8px', flexWrap: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
            <ActionBtn label="SAVE"         onClick={() => handleSave(false)} dark />
            <ActionBtn label="SAVE & PRINT" onClick={() => handleSave(true)}  dark />
            {orderType === 'Dine-In' && (
              <>
                <ActionBtn label="KOT"          onClick={() => handleKOT(false)} light />
                <ActionBtn label="KOT & PRINT"  onClick={() => handleKOT(true)}  light />
                <ActionBtn label="RESERVE"      onClick={handleReserve} light />
              </>
            )}
          </div>

          {/* Row: SETTLE BUTTONS */}
          <div style={{ padding: '4px 8px', display: 'flex', gap: 6 }}>
            <button
              onClick={() => handleSettle(false)}
              style={{
                flex: 1,
                padding: '10px 4px',
                background: C.orange,
                color: '#FFF',
                border: 'none',
                borderRadius: 4,
                fontWeight: 900,
                fontSize: 11,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              SETTLE ORDER
            </button>
            <button
              onClick={() => handleSettle(true)}
              style={{
                flex: 1,
                padding: '10px 4px',
                background: 'color-mix(in srgb, var(--primary-color, #ff7a00), white 20%)',
                color: '#FFF',
                border: 'none',
                borderRadius: 4,
                fontWeight: 900,
                fontSize: 11,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              SETTLE & BILL
            </button>
          </div>

          {/* Row 5: CLEAR TABLE */}
          <div style={{ padding: '6px 10px 10px' }}>
            <button
              onClick={handleClearTable}
              style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 3, color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              CLEAR TABLE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function InfoBox({ label, icon, active }) {
  return (
    <div style={{
      width: 58,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      borderRight: '1px solid #F0F0F0',
      cursor: 'pointer',
      background: active ? '#FAFAFA' : 'transparent'
    }}>
      <div style={{ color: active ? 'var(--primary-color)' : '#9E9E9E' }}>
        {icon}
      </div>
      {label && (
        <span style={{
          fontSize: 9,
          fontWeight: 900,
          color: active ? 'var(--primary-color)' : '#9E9E9E',
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

function ActionBtn({ label, onClick, dark }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '7px 2px',
        border: 'none',
        borderRadius: 3,
        cursor: 'pointer',
        fontWeight: 900,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        background: dark ? 'var(--primary-color)' : '#FFFFFF',
        color: dark ? '#FFF' : '#1A1A1A',
        transition: 'opacity 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {label}
    </button>
  );
}



