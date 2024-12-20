package gorico.Helpers;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.PropertyResourceBundle;
import java.util.ResourceBundle;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.SdkClientException;
import com.amazonaws.services.s3.model.S3Object;

import gorico.Constants;
import gorico.AWS.S3;

public class Localizations {

    public static void DownloadLocalizationData() throws IOException {
        S3.getInstance().InitS3();
        S3Object fullObject = null, objectPortion = null, headerOverrideObject = null;
        try {
            boolean overwrite = true;
            String dir = Constants.LOCALIZATIONS_DIR;

            for (String key : Constants.LOCALIZATIONS_KEYS.keySet()) {
                String s3Key = Constants.LOCALIZATIONS_KEYS.get(key);
                // Get an object and print its contents.
                System.out.println("Downloading " + s3Key + " to: " + dir + s3Key);
                File file = new File(dir + s3Key);

                // Check if overwrite is set to false and the file already exists
                if (!overwrite && file.exists()) {
                    System.out.println("File: " + s3Key + " already exists!");
                    return;
                }

                // Method 1
                S3.getInstance().DownloadObject(Constants.LOCALIZATIONS_BUCKET_NAME,
                        Constants.LOCALIZATIONS_BUCKET_PATH + s3Key, file, true);

            }

            // Method 2
            // fullObject = s3Client.getObject(new GetObjectRequest(bucketName, key));
            // System.out.println("Content-Type: " +
            // fullObject.getObjectMetadata().getContentType());
            // System.out.println("Saving");

            // InputStream reader = new BufferedInputStream(fullObject.getObjectContent());
            // OutputStream writer = new BufferedOutputStream(new FileOutputStream(file));

            // int read = -1;

            // while ((read = reader.read()) != -1) {
            // writer.write(read);
            // }

            // writer.flush();
            // writer.close();
            // reader.close();

            System.out.println("Saved!");

            // displayTextInputStream(fullObject.getObjectContent());

            // Get a range of bytes from an object and print the bytes.
            // GetObjectRequest rangeObjectRequest = new GetObjectRequest(bucketName, key);
            // //.withRange(0, 9);
            // objectPortion = s3Client.getObject(rangeObjectRequest);
            // System.out.println("Printing bytes retrieved.");
            // displayTextInputStream(objectPortion.getObjectContent());

            // Get an entire object, overriding the specified response headers, and print
            // the object's content.
            // ResponseHeaderOverrides headerOverrides = new
            // ResponseHeaderOverrides().withCacheControl("No-cache")
            // .withContentDisposition("attachment; filename=2pay.png");
            // GetObjectRequest getObjectRequestHeaderOverride = new
            // GetObjectRequest(bucketName, key)
            // .withResponseHeaders(headerOverrides);
            // headerOverrideObject = s3Client.getObject(getObjectRequestHeaderOverride);
            // displayTextInputStream(headerOverrideObject.getObjectContent());
        } catch (AmazonServiceException e) {
            // The call was transmitted successfully, but Amazon S3 couldn't process
            // it, so it returned an error response.
            e.printStackTrace();
        } catch (SdkClientException e) {
            // Amazon S3 couldn't be contacted for a response, or the client
            // couldn't parse the response from Amazon S3.
            e.printStackTrace();
        } finally {
            // To ensure that the network connection doesn't remain open, close any open
            // input streams.
            if (fullObject != null) {
                fullObject.close();
            }
            if (objectPortion != null) {
                objectPortion.close();
            }
            if (headerOverrideObject != null) {
                headerOverrideObject.close();
            }
        }
    }

    public static ResourceBundle GetResourceBundle(String locale) throws FileNotFoundException, IOException {
        try (FileInputStream fis = new FileInputStream(
                Constants.LOCALIZATIONS_DIR + Constants.LOCALIZATIONS_KEYS.get(locale))) {
            return new PropertyResourceBundle(fis);
        }
    }

}
