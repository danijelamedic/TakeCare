package com.takecare.backend.service;

import com.takecare.backend.dto.document.StoredDocumentFile;
import com.takecare.backend.exception.DocumentStorageException;
import com.takecare.backend.exception.InvalidDocumentFileException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentStorageService {

    private static final long MAX_FILE_SIZE =
            10L * 1024L * 1024L;

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of(
                    "application/pdf",
                    "image/jpeg",
                    "image/png"
            );

    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of(
                    "pdf",
                    "jpg",
                    "jpeg",
                    "png"
            );

    private final Path storageLocation;

    public DocumentStorageService(
            @Value("${app.document.upload-dir}") String uploadDirectory
    ) {
        this.storageLocation = Path.of(uploadDirectory)
                .toAbsolutePath()
                .normalize();
    }

    @PostConstruct
    public void initializeStorage() {

        try {
            Files.createDirectories(storageLocation);
        } catch (IOException exception) {
            throw new DocumentStorageException(
                    "Could not initialize document storage.",
                    exception
            );
        }
    }

    public StoredDocumentFile store(MultipartFile file) {

        validateFile(file);

        String originalFileName =
                StringUtils.cleanPath(
                        file.getOriginalFilename()
                );

        String extension = getExtension(originalFileName);

        String storedFileName =
                UUID.randomUUID() + "." + extension;

        Path targetLocation =
                resolveSecurePath(storedFileName);

        try (InputStream inputStream = file.getInputStream()) {

            Files.copy(
                    inputStream,
                    targetLocation,
                    StandardCopyOption.REPLACE_EXISTING
            );

            return new StoredDocumentFile(
                    storedFileName,
                    targetLocation.toString(),
                    file.getContentType(),
                    file.getSize()
            );

        } catch (IOException exception) {
            throw new DocumentStorageException(
                    "Could not store document.",
                    exception
            );
        }
    }

    public Resource load(String storedFileName) {

        Path filePath = resolveSecurePath(storedFileName);

        try {
            Resource resource =
                    new UrlResource(filePath.toUri());

            if (!resource.exists()
                    || !resource.isReadable()
                    || !Files.isRegularFile(filePath)) {

                throw new DocumentStorageException(
                        "Stored document file is not available."
                );
            }

            return resource;

        } catch (MalformedURLException exception) {
            throw new DocumentStorageException(
                    "Could not load document.",
                    exception
            );
        }
    }

    public void delete(String storedFileName) {

        Path filePath = resolveSecurePath(storedFileName);

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException exception) {
            throw new DocumentStorageException(
                    "Could not delete stored document.",
                    exception
            );
        }
    }

    private void validateFile(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new InvalidDocumentFileException(
                    "Please select a non-empty file."
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidDocumentFileException(
                    "The selected file exceeds the maximum allowed size of 10 MB."
            );
        }

        String originalFileName =
                StringUtils.cleanPath(
                        file.getOriginalFilename() == null
                                ? ""
                                : file.getOriginalFilename()
                );

        if (originalFileName.isBlank()
                || originalFileName.contains("..")) {

            throw new InvalidDocumentFileException(
                    "The selected file has an invalid name."
            );
        }

        String extension = getExtension(originalFileName);

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new InvalidDocumentFileException(
                    "Only PDF, JPEG and PNG files are allowed."
            );
        }

        String contentType = file.getContentType();

        if (contentType == null
                || !ALLOWED_CONTENT_TYPES.contains(
                contentType.toLowerCase(Locale.ROOT)
        )) {

            throw new InvalidDocumentFileException(
                    "Only PDF, JPEG and PNG files are allowed."
            );
        }

        validateFileSignature(file, extension);
    }

    private void validateFileSignature(
            MultipartFile file,
            String extension
    ) {

        try (InputStream inputStream = file.getInputStream()) {

            byte[] header = inputStream.readNBytes(8);

            boolean valid = switch (extension) {

                case "pdf" ->
                        header.length >= 5
                                && header[0] == '%'
                                && header[1] == 'P'
                                && header[2] == 'D'
                                && header[3] == 'F'
                                && header[4] == '-';

                case "jpg", "jpeg" ->
                        header.length >= 3
                                && (header[0] & 0xFF) == 0xFF
                                && (header[1] & 0xFF) == 0xD8
                                && (header[2] & 0xFF) == 0xFF;

                case "png" ->
                        header.length >= 8
                                && (header[0] & 0xFF) == 0x89
                                && header[1] == 'P'
                                && header[2] == 'N'
                                && header[3] == 'G'
                                && (header[4] & 0xFF) == 0x0D
                                && (header[5] & 0xFF) == 0x0A
                                && (header[6] & 0xFF) == 0x1A
                                && (header[7] & 0xFF) == 0x0A;

                default -> false;
            };

            if (!valid) {
                throw new InvalidDocumentFileException(
                        "The file content does not match its extension."
                );
            }

        } catch (IOException exception) {
            throw new InvalidDocumentFileException(
                    "The selected file could not be read."
            );
        }
    }

    private String getExtension(String fileName) {

        int separatorIndex = fileName.lastIndexOf('.');

        if (separatorIndex < 0
                || separatorIndex == fileName.length() - 1) {

            throw new InvalidDocumentFileException(
                    "The selected file must have a valid extension."
            );
        }

        return fileName
                .substring(separatorIndex + 1)
                .toLowerCase(Locale.ROOT);
    }

    private Path resolveSecurePath(String storedFileName) {

        Path resolvedPath =
                storageLocation
                        .resolve(storedFileName)
                        .normalize();

        if (!resolvedPath.startsWith(storageLocation)) {
            throw new DocumentStorageException(
                    "Invalid document storage path."
            );
        }

        return resolvedPath;
    }
}