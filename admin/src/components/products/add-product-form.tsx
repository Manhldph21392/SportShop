import * as React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  UncontrolledFormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";
import { FileDialog, FileWithPreview } from "./file-dialog";
import { Zoom } from "./zoom-image";
import { generateReactHelpers } from "@uploadthing/react/hooks";
import { useRouter } from "next/router";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import { ProductOptions } from "./product-options-section";
import { ProductVariants } from "./product-variants-section";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProductCreateMutation } from "@/services/products/product-create-mutation";
import { toast } from "sonner";
import { generateRandomString, isArrayOfFile } from "@/lib/utils";
import { OurFileRouter } from "@/lib/uploadthing";
import { useCategoriesQuery } from "@/services/categories/categories-query";
import slugify from "@sindresorhus/slugify";
import { productStatus } from "@/lib/contants";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Must be at least 1 character",
  }),
  description: z.string(),
  status: z.string(),
  collectionId: z.string().min(1, {
    message: "Must be at least 1 character",
  }),
  productCode: z.string().min(1, { message: "Must be at least 1 character" }),
  images: z.unknown(),
  options: z.array(
    z.object({
      name: z.string().min(1, { message: "Must be at least 1 character" }),
      values: z.array(z.string()),
    })
  ),
  variants: z.array(
    z.object({
      name: z.string(),
      price: z.number(),
      inventory: z.number(),
      options: z.array(z.object({ name: z.string(), value: z.string() })),
      sku: z.string(),
    })
  ),
});

export type Inputs = z.infer<typeof formSchema> & { images: string[] };

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export function AddProductForm() {
  const router = useRouter();
  const addProductMutation = useProductCreateMutation();
  const [upload, setUpload] = React.useState(false);
  const { data: categories } = useCategoriesQuery();

  const [files, setFiles] = React.useState<FileWithPreview[] | null>(null);

  const { isUploading, startUpload } = useUploadThing("imageUploader");

  const form = useForm<Inputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      options: [{ name: "", values: [] }],
      status: "Active",
    },
  });

  async function onSubmit(data: Inputs) {
    setUpload(true);
    const images = isArrayOfFile(data.images)
      ? await startUpload(data.images).then((res) => {
          const formattedImages = res?.map((image) => ({
            id: image.key,
            name: image.key.split("_")[1] ?? image.key,
            url: image.url,
          }));
          return formattedImages ?? null;
        })
      : null;
    setUpload(true);

    addProductMutation.mutate(
      {
        slug: slugify(data.name),
        name: data.name,
        description: data.description,
        productCode: data.productCode,
        categoryId: data.collectionId,
        options: data.options,
        variants: data.variants.map((item) => ({
          ...item,
          options: item.options.map((option) => option.value),
        })),
        images:
          images?.map((image) => ({
            name: image.name,
            url: image.url,
            publicId: image.id,
          })) ?? [],
        status: data.status,
      },
      {
        onSuccess: () => {
          router.push("/products");
          toast.success("Thêm sản phẩm thành công!");
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form
        className="grid w-full max-w-4xl mx-auto gap-5"
        onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
      >
        <Separator />
        <div>
          <h1 className="font-semibold text-lg">General information</h1>
          <p className="text-sm text-slate-500 mb-4">
            To start selling, all you need is a name and a price.
          </p>

          <div className="space-y-4">
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.name}
                  placeholder="Type product name here."
                  {...form.register("name")}
                />
              </FormControl>
              <UncontrolledFormMessage
                message={form.formState.errors.name?.message}
              />
            </FormItem>

            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Type product description here."
                  {...form.register("description")}
                />
              </FormControl>
              <UncontrolledFormMessage
                message={form.formState.errors.description?.message}
              />
            </FormItem>

            <div className="flex gap-2 items-end">
              <FormItem className="flex-1">
                <FormLabel>Product Code</FormLabel>
                <FormControl>
                  <Input
                    aria-invalid={!!form.formState.errors.productCode}
                    placeholder="SP-DSU43ID"
                    {...form.register("productCode")}
                  />
                </FormControl>
                <UncontrolledFormMessage
                  message={form.formState.errors.productCode?.message}
                />
              </FormItem>
              <Button
                type="button"
                onClick={() => {
                  form.setValue("productCode", `SP-${generateRandomString()}`);
                }}
              >
                Generate
              </Button>
            </div>

            <FormField
              control={form.control}
              name="collectionId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value: typeof field.value) =>
                        field.onChange(value)
                      }
                    >
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder={field.value} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((collection) => (
                          <SelectItem
                            key={collection._id}
                            value={collection._id}
                          >
                            {collection.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <UncontrolledFormMessage
                    message={form.formState.errors.collectionId?.message}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      defaultValue="Active"
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder={field.value} />
                      </SelectTrigger>
                      <SelectContent>
                        {productStatus.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <UncontrolledFormMessage
                    message={form.formState.errors.status?.message}
                  />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h1 className="font-semibold text-lg">Variants</h1>
          <p className="text-sm text-slate-500 mb-4">
            Add variations of this product.
          </p>

          <ProductOptions />

          <ProductVariants />
        </div>

        <Separator />

        <div>
          <h1 className="font-semibold text-lg">Image</h1>
          <p className="text-sm text-slate-500 mb-4">
            Add images to this product.
          </p>

          <FormItem className="flex w-full flex-col gap-1.5">
            <FormLabel>Images</FormLabel>
            {files?.length ? (
              <div className="flex items-center gap-2">
                {files.map((file, i) => (
                  <Zoom key={i}>
                    <Image
                      src={file.preview}
                      alt={file.name}
                      className="h-20 w-20 shrink-0 rounded-md object-cover object-center"
                      width={80}
                      height={80}
                    />
                  </Zoom>
                ))}
              </div>
            ) : null}
            <FormControl>
              <FileDialog
                setValue={form.setValue}
                name="images"
                maxFiles={3}
                maxSize={1024 * 1024 * 4}
                files={files}
                setFiles={setFiles}
                isUploading={isUploading}
              />
            </FormControl>
            <UncontrolledFormMessage
              message={form.formState.errors.images?.message}
            />
          </FormItem>
        </div>
        <Button
          type="submit"
          className="w-fit"
          disabled={addProductMutation.isPending || upload}
        >
          {(addProductMutation.isPending || upload) && (
            <Icons.spinner
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          )}
          Add Product
          <span className="sr-only">Add Product</span>
        </Button>
      </form>
    </Form>
  );
}
