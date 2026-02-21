import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Camera, Search, Eye, Package, User, Calendar } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDeliveryProofs() {
  const [search, setSearch] = useState("");
  const [selectedProof, setSelectedProof] = useState<any>(null);

  const { data: proofs, isLoading } = useQuery({
    queryKey: ["admin-delivery-proofs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_proofs")
        .select(`
          *,
          orders (
            id,
            order_number,
            total,
            status,
            delivered_at,
            buyer_id,
            courier_id,
            order_addresses (
              recipient_name,
              address,
              phone
            ),
            buyer_profiles:buyer_id (
              full_name,
              phone
            ),
            courier_profiles:courier_id (
              full_name,
              phone
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredProofs = proofs?.filter((proof) => {
    const searchLower = search.toLowerCase();
    const order = proof.orders;
    return (
      order?.order_number?.toLowerCase().includes(searchLower) ||
      (order?.courier_profiles as any)?.full_name?.toLowerCase().includes(searchLower) ||
      (order?.buyer_profiles as any)?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Bukti Pengiriman</h2>
        <p className="text-base text-gray-600">Lihat semua foto bukti pengiriman dari kurir</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nomor order, kurir, atau pembeli..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-full"
        />
      </div>

      {/* Proofs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
      ) : filteredProofs?.length === 0 ? (
        <Card className="border-0 shadow-sm bg-white" style={{ borderRadius: '32px' }}>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Camera className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Belum Ada Bukti Pengiriman
              </h3>
              <p className="text-gray-600 text-center text-sm">
                Bukti pengiriman akan muncul di sini setelah kurir menyelesaikan pengiriman
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProofs?.map((proof) => {
            const order = proof.orders;
            const courier = order?.courier_profiles as any;
            const address = Array.isArray(order?.order_addresses)
              ? order.order_addresses[0]
              : order?.order_addresses;

            return (
              <Card
                key={proof.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-0 bg-white"
                style={{ borderRadius: '24px' }}
                onClick={() => setSelectedProof(proof)}
              >
                <div className="aspect-video relative">
                  <img
                    src={proof.photo_url}
                    alt="Bukti pengiriman"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <Badge className="absolute top-3 right-3 bg-green-600 rounded-full px-3 py-1">
                    Terkirim
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-gray-900">
                      {order?.order_number}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatPrice(order?.total || 0)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>Kurir: {courier?.full_name || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="w-4 h-4" />
                      <span>Penerima: {address?.recipient_name || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(proof.created_at), "dd MMM yyyy, HH:mm", {
                          locale: id,
                        })}
                      </span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full rounded-full border-gray-200 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Lihat Detail
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Bukti Pengiriman
            </DialogTitle>
            <p className="text-sm text-gray-600 font-mono">
              {selectedProof?.orders?.order_number}
            </p>
          </DialogHeader>

          {selectedProof && (
            <div className="space-y-6">
              <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-200">
                <img
                  src={selectedProof.photo_url}
                  alt="Bukti pengiriman"
                  className="w-full max-h-96 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-600">
                    Informasi Order
                  </h4>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm border border-gray-100">
                    <p className="flex justify-between">
                      <span className="text-gray-600">No. Order:</span>
                      <span className="font-semibold text-gray-900">{selectedProof.orders?.order_number}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold text-gray-900">{formatPrice(selectedProof.orders?.total || 0)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Dikirim:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedProof.orders?.delivered_at
                          ? format(
                              new Date(selectedProof.orders.delivered_at),
                              "dd MMM yyyy, HH:mm",
                              { locale: id }
                            )
                          : "-"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-600">
                    Informasi Kurir
                  </h4>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm border border-gray-100">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Nama:</span>
                      <span className="font-semibold text-gray-900">
                        {(selectedProof.orders?.courier_profiles as any)?.full_name || "-"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Telepon:</span>
                      <span className="font-semibold text-gray-900">
                        {(selectedProof.orders?.courier_profiles as any)?.phone || "-"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-600">
                  Alamat Pengiriman
                </h4>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm border border-gray-100">
                  {(() => {
                    const addr = Array.isArray(selectedProof.orders?.order_addresses)
                      ? selectedProof.orders.order_addresses[0]
                      : selectedProof.orders?.order_addresses;
                    return (
                      <>
                        <p>
                          <span className="text-gray-600">Penerima:</span>{" "}
                          <span className="font-semibold text-gray-900">{addr?.recipient_name || "-"}</span>
                        </p>
                        <p>
                          <span className="text-gray-600">Alamat:</span>{" "}
                          <span className="text-gray-900">{addr?.address || "-"}</span>
                        </p>
                        <p>
                          <span className="text-gray-600">Telepon:</span>{" "}
                          <span className="font-semibold text-gray-900">{addr?.phone || "-"}</span>
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {selectedProof.notes && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-600">
                    Catatan Kurir
                  </h4>
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm border border-gray-100 text-gray-900">
                    {selectedProof.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
