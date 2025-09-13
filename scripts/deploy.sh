#!/bin/bash

# Builds and submits the app to eas

set -e 

echo
echo "============================"
echo "🚀 EAS Build & Deploy Script"
echo "============================"
echo

get_platform_choice() {
    echo "Select platform:"
    echo "1) Android"
    echo "2) iOS"
    echo "3) Both"
    echo
    read -p "Enter your choice (1-3): " platform_choice
    
    case $platform_choice in
        1) echo "android" ;;
        2) echo "ios" ;;
        3) echo "both" ;;
        *) 
            echo "❌ Invalid choice. Please select 1, 2, or 3."
            get_platform_choice
            ;;
    esac
}

get_profile_choice() {
    echo
    echo "Select build profile:"
    echo "1) Test (preview)"
    echo "2) Production"
    echo
    read -p "Enter your choice (1-2): " profile_choice
    
    case $profile_choice in
        1) echo "preview" ;;
        2) echo "production" ;;
        *) 
            echo "❌ Invalid choice. Please select 1 or 2."
            get_profile_choice
            ;;
    esac
}

build_platform() {
    local platform=$1
    local profile=$2
    local output_file=""
    
    if [ "$platform" = "android" ]; then
        output_file="./app-${profile}.apk"
    else
        output_file="./app-${profile}.ipa"
    fi
    
    echo
    echo "🔨 Building $platform with $profile profile..."
    echo "Output: $output_file"
    echo
    
    if bun run eas build --platform "$platform" --profile "$profile" --local --non-interactive --output="$output_file"; then
        echo "✅ Build completed successfully: $output_file"
        
        echo
        read -p "📤 Do you want to submit the build? (y/N): " submit_choice
        
        if [[ $submit_choice =~ ^[Yy]$ ]]; then
            echo "🚀 Submitting to app store..."
            if bun run eas submit -p "$platform" --path "$output_file"; then
                echo "✅ Submission completed successfully!"
            else
                echo "❌ Submission failed!"
                return 1
            fi
        else
            echo "⏭️  Skipping submission."
        fi
    else
        echo "❌ Build failed for $platform!"
        return 1
    fi
}

echo "⚠️  Note: Make sure to remove plist and google service json files from .gitignore beforehand"
echo "   EAS ignores any file in .gitignore but we want to keep our API keys secret"
echo
read -p "Press Enter to continue or Ctrl+C to exit..."

PLATFORM=$(get_platform_choice)
PROFILE=$(get_profile_choice)

echo
echo "📋 Summary:"
echo "Platform: $PLATFORM"
echo "Profile: $PROFILE"
echo
read -p "Proceed with build? (Y/n): " confirm

if [[ $confirm =~ ^[Nn]$ ]]; then
    echo "❌ Build cancelled."
    exit 0
fi

if [ "$PLATFORM" = "both" ]; then
    echo
    echo "🔄 Building for both platforms..."
    
    if build_platform "android" "$PROFILE" && build_platform "ios" "$PROFILE"; then
        echo
        echo "🎉 All builds completed successfully!"
    else
        echo
        echo "❌ One or more builds failed!"
        exit 1
    fi
elif [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "ios" ]; then
    if build_platform "$PLATFORM" "$PROFILE"; then
        echo
        echo "🎉 Build completed successfully!"
    else
        echo
        echo "❌ Build failed!"
        exit 1
    fi
fi

echo
echo "✨ Submission finished!"
