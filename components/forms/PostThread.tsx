"use client";

// UI components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// form validation with zod
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
// pathname and router
import { usePathname, useRouter } from "next/navigation";
// user validation schema
import { ThreadValidation } from "@/lib/validations/thread";
import { createThread } from "@/lib/actions/thread.actions";
import { useState } from "react";
import Dropzone from "react-dropzone";
// update user
// import { updateUser } from "@/lib/actions/user.actions";

interface Props {
  asset: File;
  assetType: string;
}

export default function PostThread({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<File>();
  const [selectedAssetType, setSelectedAssetType] = useState<string>("");

  // form creation with form validation with zod
  const form = useForm({
    resolver: zodResolver(ThreadValidation),
    defaultValues: {
      thread: "",
      accountId: userId,
    },
  });

  const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
    if (selectedAsset && selectedAssetType) {
      // attempt to upload asset to cloudinary
      await uploadAsset({ asset: selectedAsset, assetType: selectedAssetType });
    }

    // create post in DB and reroute
    await createThread({
      text: values.thread,
      author: userId,
      communityId: null,
      // pass in pathname 'create'
      path: pathname,
    });

    router.push("/");
  };

  const uploadAsset = async ({ asset, assetType }: Props) => {
    const data = new FormData();
    data.append("file", asset);
    data.append("upload_preset", "social-media-image-upload");
    data.append("cloud_name", "fajarda1storage");
    // specify folder
    data.append("folder", "Threads");
    const cloudinaryURL = `https://api.cloudinary.com/v1_1/fajarda1storage/${assetType}/upload`;

    try {
      const response = await fetch(cloudinaryURL, {
        method: "POST",
        body: data,
      });
      // asset POST response data & return the asset URL alone
      const assetData = await response.json();

      // store this url in the database
      console.log(assetData.url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-10 flex flex-col justify-start gap-10"
      >
        {/* render text area fiel input */}
        <FormField
          control={form.control}
          name="thread"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 w-full">
              <FormLabel className="text-base-semibold text-light-2">
                Content
              </FormLabel>
              <FormControl className="no-focus border border-dark-4 bg-dark-3 text-light-1">
                <Textarea
                  rows={15}
                  className="account-form_input no-focus"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Dropzone
          onDrop={async (acceptedFiles) => {
            const asset = acceptedFiles[0]; // file object itself
            const assetType = acceptedFiles[0].type.split("/")[0]; // either 'image' or 'video'
            setSelectedAsset(asset);
            setSelectedAssetType(assetType);

            // show asset as a preview
            const file = new FileReader();
            file.onload = () => {
              setPreview(file.result);
            };
            file.readAsDataURL(asset);
          }}
        >
          {({ getRootProps, getInputProps }) => (
            <section className="flex sm:justify-end justify-center">
              <div className="w-fit">
                <div {...getRootProps()}>
                  <input
                    {...getInputProps()}
                    accept="image/png, image/jpg, video/mp4"
                  />
                  <p className="flex justify-center items-center gap-5 bg-primary-500 rounded cursor-pointer hover:bg-slate-900/90 stroke-white transition-all p-2 text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      className="bi bi-camera stroke-1 transition-all"
                      viewBox="0 0 16 16"
                      width="30px"
                      height="30px"
                    >
                      <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z" />{" "}
                      <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" />{" "}
                    </svg>
                    {preview ? "Change File" : "Upload File (Optional)"}
                  </p>
                </div>
                <p
                  style={{ fontSize: 12 }}
                  className="px-2 text-white sm:text-end text-center italic"
                >
                  *Upload An Image Or Video
                </p>
              </div>
            </section>
          )}
        </Dropzone>

        {preview && (
          <div className="flex justify-center">
            {selectedAsset && selectedAsset.type.split("/")[0] === "video" ? (
              <video
                className="w-44 rounded border-2 border-white-500"
                width="500px"
                height="500px"
                controls="controls"
              >
                {/* video */}
                <source src={preview} type="video/mp4" />
              </video>
            ) : (
              <img
                className="w-44 rounded border-2 border-white-500"
                src={preview}
              />
            )}
          </div>
        )}

        <Button type="submit" className="bg-primary-500">
          Post Thread
        </Button>
      </form>
    </Form>
  );
}
