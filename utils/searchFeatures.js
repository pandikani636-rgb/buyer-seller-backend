class SearchFeatures {
    constructor(query, queryString) {
        this.query = query
        this.queryString = queryString
    }

    search() {
        const keyword = this.queryString.keyword ? {
            name: {
                $regex: this.queryString.keyword,
                $options: "i",
            }
        } : {};

        // console.log(keyword);

        this.query = this.query.find({ ...keyword });
        return this;
    }

    filter() {
        const queryCopy = { ...this.queryString }

        // fields to remove for category
        const removeFields = ["keyword", "page", "limit"];

        removeFields.forEach(key => delete queryCopy[key]);

        // 🛠️ FIX: Explicitly cast numeric filters to Numbers
        // Mongoose doesn't always cast nested values in $gte/$lte when passed from a plain JSON object
        if (queryCopy.price) {
            if (queryCopy.price.gte) queryCopy.price.gte = Number(queryCopy.price.gte);
            if (queryCopy.price.lte) queryCopy.price.lte = Number(queryCopy.price.lte);
        }
        if (queryCopy.ratings && queryCopy.ratings.gte) {
            queryCopy.ratings.gte = Number(queryCopy.ratings.gte);
        }

        // price filter/operators
        let queryString = JSON.stringify(queryCopy);
        queryString = queryString.replace(/\b(gt|gte|lt|lte)\b/g, key => `$${key}`);

        this.query = this.query.find(JSON.parse(queryString));
        return this;
    }

    pagination(resultPerPage) {
        const currentPage = Number(this.queryString.page) || 1;

        const skipProducts = resultPerPage * (currentPage - 1);

        this.query = this.query.limit(resultPerPage).skip(skipProducts);
        return this;
    }
};

module.exports = SearchFeatures;