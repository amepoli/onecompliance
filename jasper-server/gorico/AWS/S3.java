package gorico;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.SdkClientException;
import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.ResponseHeaderOverrides;
import com.amazonaws.services.s3.model.S3Object;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.*;
import java.io.InputStreamReader;

// import javax.print.DocFlavor.URL;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.HttpMethod;
import com.amazonaws.SdkClientException;
import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import java.io.IOException;
import java.net.URL;

public class S3 {

    private Regions clientRegion = null;
    private String bucketName = null;
    private AmazonS3 s3Client = null;
    private static S3 instance = null;

    public static S3 getInstance() {
        if (instance == null) {
            instance = new S3();
        }
        return instance;
    }

    public S3() {
        this.InitS3();
    }

    public void InitS3() {
        if (s3Client == null) {
            this.clientRegion = Regions.EU_CENTRAL_1;
            this.bucketName = "gorico2-reports";
            this.s3Client = AmazonS3ClientBuilder.standard().withRegion(clientRegion)
                    // .withCredentials(new ProfileCredentialsProvider())
                    .build();
        }
    }

    public void CreateBucket() {
        this.InitS3();
        try {

            if (!s3Client.doesBucketExistV2(bucketName)) {
                // Because the CreateBucketRequest object doesn't specify a region, the
                // bucket is created in the region specified in the client.
                s3Client.createBucket(bucketName);

                // Verify that the bucket was created by retrieving it and checking its
                // location.
                String bucketLocation = s3Client.getBucketLocation(bucketName);
                System.out.println("Bucket location: " + bucketLocation);
            } else {
                System.out.println("Bucket already exists!");
            }
        } catch (AmazonServiceException e) {
            // The call was transmitted successfully, but Amazon S3 couldn't process
            // it and returned an error response.
            e.printStackTrace();
        } catch (SdkClientException e) {
            // Amazon S3 couldn't be contacted for a response, or the client
            // couldn't parse the response from Amazon S3.
            e.printStackTrace();
        }
    }

    public void GetObject(String key, String path, boolean overwrite) throws IOException {
        this.InitS3();
        S3Object fullObject = null, objectPortion = null, headerOverrideObject = null;
        try {

            // Get an object and print its contents.
            System.out.println("Downloading " + key + " to: " + path + key);
            File file = new File(path + key);

            // Check if overwrite is set to false and the file already exists
            if (!overwrite && file.exists()) {
                System.out.println("File: " + key + " already exists!");
                return;
            }

            // Method 1
            ObjectMetadata object = s3Client.getObject(new GetObjectRequest(bucketName, key), file);

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

    public String PutObject(String key, File file) {
        try {
            this.s3Client.putObject(this.bucketName, key, file);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            return this.s3Client.getUrl(this.bucketName, key).toExternalForm();
        }
    }

    public String PutPreSignedObject(String key, File file) {
        try {
            this.s3Client.putObject(this.bucketName, key, file);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            // Set the presigned URL to expire after one hour.
            java.util.Date expiration = new java.util.Date();
            long expTimeMillis = expiration.getTime();
            expTimeMillis += 1000 * 60 * 60 * 24 * 7;
            expiration.setTime(expTimeMillis);
            System.out.println("Generating pre-signed URL.");
            
            GeneratePresignedUrlRequest generatePresignedUrlRequest =
                    new GeneratePresignedUrlRequest(this.bucketName, key)
                            .withMethod(HttpMethod.GET)
                            .withExpiration(expiration);
            URL url = s3Client.generatePresignedUrl(generatePresignedUrlRequest);

            System.out.println("Pre-Signed URL: " + url.toString());

            return url.toString();

            // return this.s3Client.getUrl(this.bucketName, key).toExternalForm();
        }
    }

    private void displayTextInputStream(InputStream input) throws IOException {
        // Read the text input stream one line at a time and display each line.
        BufferedReader reader = new BufferedReader(new InputStreamReader(input));
        String line = null;
        while ((line = reader.readLine()) != null) {
            System.out.println(line);
        }
        System.out.println();
    }
}