import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingCart, Check, X } from "lucide-react";
import { purchaseOrderService } from "../../services/financeService";
import toast from "react-hot-toast";

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vendor_name: "",
    items: [{ name: "", quantity: 1, price: 0 }],
    order_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await purchaseOrderService.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: "", quantity: 1, price: 0 }],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];

    if (field === "quantity") {
      newItems[index][field] = Number(value) || 0;
    } else if (field === "price") {
      newItems[index][field] = Number(value) || 0;
    } else {
      newItems[index][field] = value;
    }

    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!formData.vendor_name.trim()) {
        return toast.error("Vendor name required");
      }
      // ✅ sanitize items
      const cleanedItems = formData.items
        .map((item) => ({
          name: item.name.trim(),
          quantity: Number(item.quantity),
          price: Number(item.price),
        }))
        .filter(
          (item) =>
            item.name &&
            !isNaN(item.quantity) &&
            !isNaN(item.price) &&
            item.quantity > 0 &&
            item.price >= 0,
        );

      if (cleanedItems.length === 0) {
        return toast.error("Add valid items");
      }

      const totalAmount = cleanedItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
      );

      const data = {
        vendor_name: formData.vendor_name.trim(),
        items: cleanedItems,
        total_amount: totalAmount,
        order_date: formData.order_date,
      };

      await purchaseOrderService.add(data);

      toast.success("Purchase order created successfully");

      setShowModal(false);

      setFormData({
        vendor_name: "",
        items: [{ name: "", quantity: 1, price: 0 }],
        order_date: new Date().toISOString().split("T")[0],
      });

      fetchOrders();
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create purchase order");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await purchaseOrderService.updateStatus(id, status);
      toast.success(`Order ${status} successfully`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await purchaseOrderService.delete(id);
      toast.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">
            Manage vendor purchases and approvals
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-br from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 transition"
        >
          <Plus className="w-5 h-5" />
          Create Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-3xl font-extrabold tracking-tight text-gray-900 mt-1">
                {orders.length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-extrabold tracking-tight text-gray-900 mt-1">
                {orders.filter((o) => o.status === "pending").length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-md">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-3xl font-extrabold tracking-tight text-gray-900 mt-1">
                ₹
                {orders
                  .filter((o) => o.status === "approved") // ✅ only approved
                  .reduce((sum, o) => sum + Number(o.total_amount), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          All Purchase Orders
        </h2>
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Vendor
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Items
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No purchase orders yet
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium">
                      {order.vendor_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {order.items?.length || 0} items
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      ₹{parseFloat(order.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-sm ${getStatusColor(order.status)}`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(order.id, "approved")
                              }
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(order.id, "rejected")
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              Create Purchase Order
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.vendor_name}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter vendor name"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <input
                        type="text"
                        required
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) =>
                          handleItemChange(index, "name", e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            parseInt(e.target.value),
                          )
                        }
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "price",
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg font-semibold">
                  Total: ₹{calculateTotal().toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.order_date}
                  onChange={(e) =>
                    setFormData({ ...formData, order_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 transition"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
