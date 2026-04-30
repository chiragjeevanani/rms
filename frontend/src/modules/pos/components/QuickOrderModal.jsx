import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Truck, Utensils, Car, User, Phone } from 'lucide-react';

const QuickOrderModal = ({ isOpen, onClose, tables, onStartOrder }) => {
  const [orderType, setOrderType] = useState('Dine-In');
  const [selectedTable, setSelectedTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [carNumber, setCarNumber] = useState('');

  const freeTables = tables.filter(t => t.status === 'Available' || t.status === 'blank' || !t.status);

  const handleStart = () => {
    let identifier = '';
    if (orderType === 'Dine-In') {
      if (!selectedTable) {
        alert('Please select a table');
        return;
      }
      identifier = selectedTable;
    } else if (orderType === 'Car Service') {
      if (!carNumber) {
        alert('Please enter car number');
        return;
      }
      identifier = carNumber.toUpperCase().startsWith('CAR-') ? carNumber.toUpperCase() : `CAR-${carNumber.toUpperCase()}`;
    } else {
      // Delivery or Takeaway
      const timestamp = new Date().getTime().toString().slice(-4);
      identifier = `${orderType === 'Delivery' ? 'DEL' : 'TAK'}-${timestamp}`;
    }

    onStartOrder({
      type: orderType,
      identifier,
      customer: {
        name: customerName,
        mobile: customerPhone
      }
    });
    
    // Reset and close
    setCustomerName('');
    setCustomerPhone('');
    setCarNumber('');
    setSelectedTable('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 italic flex items-center gap-2">
              <ShoppingBag size={18} className="text-orange-500" /> Quick Order Entry
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Type Selection */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Dine-In', icon: <Utensils size={14} />, label: 'Dine-In' },
                { id: 'Takeaway', icon: <ShoppingBag size={14} />, label: 'Takeaway' },
                { id: 'Delivery', icon: <Truck size={14} />, label: 'Delivery' },
                { id: 'Car Service', icon: <Car size={14} />, label: 'Car' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setOrderType(type.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-bold text-[10px] uppercase tracking-wider ${
                    orderType === type.id
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                  }`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>

            {/* Dine-In specific: Table Selection */}
            {orderType === 'Dine-In' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Table</label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 text-xs font-black focus:border-orange-500 outline-none transition-all"
                >
                  <option value="">Choose a table...</option>
                  {freeTables.map(t => (
                    <option key={t._id} value={t.tableName}>{t.tableName} ({t.area || 'General'})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Car Service specific: Car Number */}
            {orderType === 'Car Service' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Car Number</label>
                <input
                  type="text"
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. DL 4C AB 1234"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 text-sm font-black focus:border-orange-500 outline-none transition-all uppercase"
                />
              </div>
            )}

            {/* Common: Customer Details */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Customer Name (Optional)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter Name"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm font-black focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter Number"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm font-black focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full py-4 bg-orange-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition-all mt-2"
            >
              Start Order Process
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickOrderModal;
