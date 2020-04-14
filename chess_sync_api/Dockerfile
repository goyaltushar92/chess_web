#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/core/aspnet:3.1-buster-slim AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://*:8080

FROM mcr.microsoft.com/dotnet/core/sdk:3.1-buster AS buildbase
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt update
RUN apt-get install -y apt-utils
RUN apt-get install -y nodejs gcc g++ make yarn

FROM buildbase as build
WORKDIR /src
COPY "chess_sync_api.csproj" "chess_sync_api/"
RUN dotnet restore "chess_sync_api/chess_sync_api.csproj"
COPY . "chess_sync_api"
WORKDIR "/src/chess_sync_api"
RUN dotnet build "chess_sync_api.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR "/src/chess_sync_api"
RUN dotnet publish "chess_sync_api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["sudo", "dotnet", "chess_sync_api.dll"]