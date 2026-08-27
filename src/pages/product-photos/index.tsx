import withErrorBoundary from "@/components/hoc/with-error-boundary";
import ProductPhotos from "@/components/product-photos";

const ProductPhotosPage = () => {
  return <ProductPhotos />;
};

const ProductPhotosPageWithErrorBoundary = withErrorBoundary({
  component: "ProductPhotosPage",
})(ProductPhotosPage);

export default ProductPhotosPageWithErrorBoundary;
