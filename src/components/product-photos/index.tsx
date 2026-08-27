import { useRef, useState } from "react";
import { toast } from "sonner";
import { getSdk } from "@/config/medusa";
import { useSalesChannel } from "@/context/sales-channel";
import { useQueryProducts } from "@/hooks/queries/useQueryProducts";
import { handleErrorToast } from "@/utils/helpers";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Camera, Upload } from "lucide-react";
import type { AdminProduct } from "@medusajs/types";

const ProductPhotos = () => {
  const { t } = useTranslation();
  const salesChannelId = useSalesChannel((state) => state.salesChannelId);
  const { data: products = [], isLoading } = useQueryProducts(salesChannelId);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminProduct | null>(null);
  const [uploading, setUploading] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const filtered =
    search.trim().length === 0
      ? []
      : products.filter((p) =>
          p.title?.toLowerCase().includes(search.trim().toLowerCase())
        );

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selected) return;

    setUploading(true);
    try {
      const sdk = getSdk();
      const { files: uploaded } = await sdk.admin.upload.create(files);

      const existingImages = (selected.images ?? []).map((img) => ({
        url: img.url,
      }));
      const newImages = uploaded.map((file) => ({ url: file.url }));

      const { product: updated } = await sdk.admin.product.update(
        selected.id,
        { images: [...existingImages, ...newImages] }
      );

      setSelected(updated as AdminProduct);
      toast.success(t("product_photos.upload_success"));
    } catch (error) {
      handleErrorToast(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      <h1 className="text-xl font-semibold">{t("product_photos.title")}</h1>

      <Input
        placeholder={t("product_photos.search_placeholder")}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelected(null);
        }}
      />

      {isLoading && <LoadingSpinner size={28} />}

      {!selected && filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.slice(0, 20).map((product) => (
            <button
              key={product.id}
              onClick={() => setSelected(product)}
              className="flex items-center gap-3 p-3 rounded-md border text-left hover:bg-accent"
            >
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt=""
                  className="size-12 rounded object-cover"
                />
              ) : (
                <div className="size-12 rounded bg-muted" />
              )}
              <span className="font-medium">{product.title}</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{selected.title}</span>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              {t("product_photos.change_product")}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(selected.images ?? []).map((img) => (
              <img
                key={img.id ?? img.url}
                src={img.url}
                alt=""
                className="aspect-square rounded object-cover"
              />
            ))}
          </div>

          <div className="flex gap-3">
            {/* capture="environment" opens the device's back camera directly,
                via the WebView's native file-chooser -- no Tauri camera
                plugin needed. */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
            />

            <Button
              className="flex-1"
              disabled={uploading}
              onClick={() => cameraInputRef.current?.click()}
            >
              {uploading ? <LoadingSpinner size={20} /> : <Camera />}
              {t("product_photos.take_photo")}
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              disabled={uploading}
              onClick={() => galleryInputRef.current?.click()}
            >
              <Upload />
              {t("product_photos.upload_image")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPhotos;
